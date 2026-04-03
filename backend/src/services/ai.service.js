/**
 * ai.service.js
 *
 * All functions destructured and exported correctly so item.controller.js
 * can import them directly.
 *
 * saveMatchesAndNotify now sends a match notification email to the
 * lost item owner after saving each new match.
 */

const axios        = require('axios');
const FormData     = require('form-data');
const fs           = require('fs');
const { pool }     = require('../config/db');
const emailService = require('./email.service');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';


// ── SBERT text embedding (768-dim) ────────────────────────────────────────────

async function generateTextEmbedding(itemId, text, extraFields = {}) {
    try {
        const response = await axios.post(`${AI_URL}/ai/embed/text`, {
            item_id:        itemId,
            text,
            title:          extraFields.title          || '',
            brand:          extraFields.brand          || '',
            colour:         extraFields.colour         || '',
            distinguishing: extraFields.distinguishing || '',
            item_type:      extraFields.item_type      || ''
        });
        console.log(`[AI] SBERT embedding saved for item ${itemId} (${response.data.embedding_dim}-dim)`);
        return true;
    } catch (err) {
        console.error(`[AI] generateTextEmbedding failed for item ${itemId}:`,
            err.response?.data?.detail || err.message);
        return null;
    }
}


// ── CLIP text embedding for cross-modal (512-dim) ────────────────────────────

async function generateClipTextEmbedding(itemId, text, extraFields = {}) {
    try {
        const response = await axios.post(`${AI_URL}/ai/embed/clip-text`, {
            item_id:        itemId,
            text,
            title:          extraFields.title          || '',
            brand:          extraFields.brand          || '',
            colour:         extraFields.colour         || '',
            distinguishing: extraFields.distinguishing || '',
            item_type:      extraFields.item_type      || ''
        });
        console.log(`[AI] CLIP text embedding saved for item ${itemId} (cross-modal, ${response.data.embedding_dim}-dim)`);
        return true;
    } catch (err) {
        console.error(`[AI] generateClipTextEmbedding failed for item ${itemId}:`,
            err.response?.data?.detail || err.message);
        return null;
    }
}


// ── CLIP image embedding (512-dim) ────────────────────────────────────────────

async function generateImageEmbedding(itemId, imagePath) {
    if (!imagePath) return null;
    try {
        // Use image-path endpoint — avoids re-uploading the file
        const response = await axios.post(`${AI_URL}/ai/embed/image-path`, {
            item_id:    itemId,
            image_path: imagePath
        });
        console.log(`[AI] CLIP image embedding saved for item ${itemId} (${response.data.embedding_dim}-dim)`);
        return true;
    } catch (err) {
        console.error(`[AI] generateImageEmbedding failed for item ${itemId}:`,
            err.response?.data?.detail || err.message);
        return null;
    }
}


// ── Find matches for a FOUND item ─────────────────────────────────────────────

async function findMatchesForFoundItem(foundItemId) {
    try {
        const response = await axios.post(`${AI_URL}/ai/match`, { found_item_id: foundItemId });
        return response.data.matches || [];
    } catch (err) {
        console.error(`[AI] findMatchesForFoundItem failed:`, err.response?.data?.detail || err.message);
        return [];
    }
}


// ── Find matches for a LOST item ──────────────────────────────────────────────

async function findMatchesForLostItem(lostItemId) {
    try {
        const response = await axios.post(`${AI_URL}/ai/rematch`, { found_item_id: lostItemId });
        return response.data.matches || [];
    } catch (err) {
        console.error(`[AI] findMatchesForLostItem failed:`, err.response?.data?.detail || err.message);
        return [];
    }
}


// ── Save matches to DB + notify owner (notification + email) ──────────────────
//
// This is the ONLY place match notifications are created.
// It both inserts the DB notification row AND sends an email to the owner.

async function saveMatchesAndNotify(matches, triggerId, itemType) {
    if (!matches || matches.length === 0) return;

    for (const match of matches) {
        try {
            const otherId         = match.lost_item_id || match.found_item_id;
            const confidenceScore = match.confidence_score;  // % → 0-1

            const actualLostId  = itemType === 'Found' ? otherId   : triggerId;
            const actualFoundId = itemType === 'Found' ? triggerId : otherId;
            const pct           = Math.round(match.confidence_score);

            // Get pending status id
            const statusRes = await pool.query(
                "SELECT status_id FROM match_status WHERE status_name = 'pending' LIMIT 1"
            );
            const statusId = statusRes.rows[0]?.status_id || 1;

            // Insert match row — ON CONFLICT skips duplicates
            const matchRes = await pool.query(
                `INSERT INTO matches (lost_item_id, found_item_id, status_id, confidence_score)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (lost_item_id, found_item_id) DO NOTHING
                 RETURNING match_id`,
                [actualLostId, actualFoundId, statusId, confidenceScore]
            );

            // Skip if duplicate (no match_id returned)
            if (matchRes.rows.length === 0) {
                console.log(`[AI] Match already exists: lost=${actualLostId} found=${actualFoundId} — skipping`);
                continue;
            }

            const matchId = matchRes.rows[0].match_id;

            // Get lost item owner details for notification + email
            const ownerRes = await pool.query(
                `SELECT u.user_id, u.name, u.email, i.title
                 FROM items i
                 JOIN users u ON u.user_id = i.user_id
                 WHERE i.item_id = $1`,
                [actualLostId]
            );
            if (ownerRes.rows.length === 0) continue;

            const { user_id: ownerId, name: ownerName, email: ownerEmail, title } = ownerRes.rows[0];
            const notifContent = `A possible match has been found for your lost item: "${title}". Confidence: ${pct}%`;

            // 1. Insert in-app notification
            await pool.query(
                `INSERT INTO notifications (user_id, item_id, match_id, content, type, email_sent)
                 VALUES ($1, $2, $3, $4, 'match_found', FALSE)`,
                [ownerId, actualLostId, matchId, notifContent]
            );

            // 2. Send email to lost item owner
            try {
                await emailService.sendMatchNotificationEmail(
                    ownerEmail,
                    ownerName,
                    title,
                    pct,
                    matchId
                );

                // Mark email as sent in notifications
                await pool.query(
                    `UPDATE notifications SET email_sent = TRUE
                     WHERE match_id = $1 AND user_id = $2`,
                    [matchId, ownerId]
                );

                console.log(`[AI] Match email sent to ${ownerEmail} for item "${title}" (${pct}% confidence)`);
            } catch (emailErr) {
                // Email failure is non-fatal — notification is still saved in-app
                console.error(`[AI] Match email failed for ${ownerEmail}:`, emailErr.message);
            }

            console.log(`[AI] Match saved: lost=${actualLostId} found=${actualFoundId} score=${pct}%`);

        } catch (err) {
            console.error('[AI] saveMatchesAndNotify error:', err.message);
        }
    }
}


module.exports = {
    generateTextEmbedding,
    generateClipTextEmbedding,
    generateImageEmbedding,
    findMatchesForFoundItem,
    findMatchesForLostItem,
    saveMatchesAndNotify
};
// ─────────────────────────────────────────────────────────────────────────────
// item.controller.js
// ─────────────────────────────────────────────────────────────────────────────

const { pool } = require('../config/db');
const path     = require('path');

// ── AI service — destructure all functions explicitly ────────────────────────
// BUG FIX: previously only `const aiService = require(...)` was used,
// meaning generateTextEmbedding, generateClipTextEmbedding etc. were
// called as bare names inside setImmediate and threw ReferenceError silently.
const {
    generateTextEmbedding,
    generateClipTextEmbedding,
    generateImageEmbedding,
    findMatchesForFoundItem,
    findMatchesForLostItem,
    saveMatchesAndNotify
} = require('../services/ai.service');

// ── Email service ─────────────────────────────────────────────────────────────
const emailService = require('../services/email.service');


// ─────────────────────────────────────────────
// POST /api/items/found
// ─────────────────────────────────────────────
async function reportFoundItem(req, res) {
    const { title, description, category_id, location } = req.body;
    const userId = req.user.user_id;

    if (!title || !description || !category_id) {
        return res.status(400).json({ error: 'title, description, and category_id are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const itemResult = await client.query(
            `INSERT INTO items (title, description, category_id, location, type, user_id, status, expires_at)
             VALUES ($1, $2, $3, $4, 'Found', $5, 'active', NOW() + INTERVAL '30 days')
             RETURNING item_id, title`,
            [title, description, category_id, location || null, userId]
        );
        const { item_id: itemId, title: savedTitle } = itemResult.rows[0];

        if (req.file) {
            await client.query(
                `INSERT INTO item_image (item_id, image_url, is_primary, sequence_no)
                 VALUES ($1, $2, TRUE, 1)`,
                [itemId, req.file.filename]
            );
        }

        await client.query('COMMIT');

        // AI pipeline runs in background — response sent immediately
        setImmediate(async () => {
            try {
                const enrichedText = `${title} ${description}`.trim();
                const extraFields  = { title, item_type: 'Found' };

                await generateTextEmbedding(itemId, enrichedText, extraFields);
                await generateClipTextEmbedding(itemId, enrichedText, extraFields);

                if (req.file) {
                    await generateImageEmbedding(itemId, req.file.path);
                }

                const matches = await findMatchesForFoundItem(itemId);

                // saveMatchesAndNotify also sends match emails to lost item owners
                await saveMatchesAndNotify(matches, itemId, 'Found');

            } catch (err) {
                console.error('[reportFoundItem] AI pipeline error:', err.message);
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Found item reported. AI matching running in the background.',
            item_id: itemId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[reportFoundItem] DB error:', error.message);
        return res.status(500).json({ error: 'Failed to report found item' });
    } finally {
        client.release();
    }
}


// ─────────────────────────────────────────────
// POST /api/items/lost
// ─────────────────────────────────────────────
async function reportLostItem(req, res) {
    const { title, description, category_id, location, hidden_details } = req.body;
    const userId = req.user.user_id;

    if (!title || !description || !category_id) {
        return res.status(400).json({ error: 'title, description, and category_id are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const itemResult = await client.query(
            `INSERT INTO items
             (title, description, category_id, location, type, user_id, hidden_details, status, expires_at)
             VALUES ($1, $2, $3, $4, 'Lost', $5, $6, 'active', NOW() + INTERVAL '30 days')
             RETURNING item_id, title`,
            [title, description, category_id, location || null, userId, hidden_details || null]
        );
        const { item_id: itemId } = itemResult.rows[0];

        if (req.file) {
            await client.query(
                `INSERT INTO item_image (item_id, image_url, is_primary, sequence_no)
                 VALUES ($1, $2, TRUE, 1)`,
                [itemId, req.file.filename]
            );
        }

        await client.query('COMMIT');

        setImmediate(async () => {
            try {
                const enrichedText = `${title} ${description}`.trim();
                const extraFields  = { title, item_type: 'Lost' };

                await generateTextEmbedding(itemId, enrichedText, extraFields);
                await generateClipTextEmbedding(itemId, enrichedText, extraFields);

                if (req.file) {
                    await generateImageEmbedding(itemId, req.file.path);
                }

                const matches = await findMatchesForLostItem(itemId);

                // saveMatchesAndNotify also sends match emails to lost item owners
                await saveMatchesAndNotify(matches, itemId, 'Lost');

            } catch (err) {
                console.error('[reportLostItem] AI pipeline error:', err.message);
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Lost item reported. AI matching running in the background.',
            item_id: itemId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[reportLostItem] DB error:', error.message);
        return res.status(500).json({ error: 'Failed to report lost item' });
    } finally {
        client.release();
    }
}


// ─────────────────────────────────────────────
// GET /api/items/my-items
// ─────────────────────────────────────────────
async function getMyItems(req, res) {
    const userId = req.user.user_id;
    const { type, status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const params  = [userId];
    const filters = ['i.user_id = $1'];

    if (type   && ['Lost','Found'].includes(type))                     { params.push(type);   filters.push(`i.type = $${params.length}`); }
    if (status && ['active','resolved','expired'].includes(status))    { params.push(status); filters.push(`i.status = $${params.length}`); }

    const where = filters.join(' AND ');

    try {
        const countRes = await pool.query(
            `SELECT COUNT(*) FROM items i WHERE ${where}`, params
        );
        const total = parseInt(countRes.rows[0].count);

        params.push(parseInt(limit), offset);
        const result = await pool.query(
            `SELECT
                i.item_id,
                i.title,
                i.description,
                i.type,
                i.status,
                i.location,
                i.date_reported,
                i.is_active,
                c.category_name,
                img.image_url AS primary_image,
                (SELECT COUNT(*) FROM matches m
                 WHERE m.lost_item_id = i.item_id OR m.found_item_id = i.item_id) AS match_count
             FROM items i
             JOIN category c ON c.category_id = i.category_id
             LEFT JOIN item_image img ON img.item_id = i.item_id AND img.is_primary = TRUE
             WHERE ${where}
             ORDER BY i.date_reported DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return res.json({
            success: true,
            total,
            page: parseInt(page),
            items: result.rows
        });

    } catch (error) {
        console.error('[getMyItems] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch items' });
    }
}


// ─────────────────────────────────────────────
// GET /api/items/:itemId
// ─────────────────────────────────────────────
async function getItemById(req, res) {
    const { itemId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `SELECT
                i.item_id, i.title, i.description, i.type, i.status, i.location,
                i.date_reported, i.hidden_details, i.is_active,
                c.category_name, c.category_id,
                u.name AS reported_by,
                img.image_url AS primary_image
             FROM items i
             JOIN category c ON c.category_id = i.category_id
             JOIN users u ON u.user_id = i.user_id
             LEFT JOIN item_image img ON img.item_id = i.item_id AND img.is_primary = TRUE
             WHERE i.item_id = $1 AND i.is_active = TRUE`,
            [itemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = result.rows[0];

        // Only expose hidden_details to the item's own owner
        if (item.hidden_details && parseInt(itemId)) {
            const ownerCheck = await pool.query(
                'SELECT user_id FROM items WHERE item_id = $1', [itemId]
            );
            if (ownerCheck.rows[0]?.user_id !== userId) {
                item.hidden_details = null;
            }
        }

        return res.json({ success: true, item });

    } catch (error) {
        console.error('[getItemById] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch item' });
    }
}


// ─────────────────────────────────────────────
// GET /api/items/:itemId/matches
// ─────────────────────────────────────────────
async function getMatchesForItem(req, res) {
    const { itemId } = req.params;
    const userId = req.user.user_id;

    try {
        const ownerCheck = await pool.query(
            `SELECT type, hidden_details FROM items
             WHERE item_id = $1 AND user_id = $2 AND is_active = TRUE`,
            [itemId, userId]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Item not found or access denied' });
        }

        const itemType = ownerCheck.rows[0].type;
        const hiddenDetails = itemType === 'Lost' ? ownerCheck.rows[0].hidden_details : null;

        const matchQuery = itemType === 'Lost'
            ? `SELECT
                m.match_id, m.confidence_score, m.created_at AS matched_at,
                ms.status_name AS match_status, m.owner_feedback,
                found_item.item_id      AS found_item_id,
                found_item.title        AS found_title,
                found_item.description  AS found_description,
                found_item.location     AS found_location,
                found_item.date_reported AS found_date,
                finder.user_id          AS finder_user_id,
                finder.name             AS finder_name,
                img.image_url           AS found_image
               FROM matches m
               JOIN match_status ms      ON ms.status_id = m.status_id
               JOIN items found_item     ON found_item.item_id = m.found_item_id
               JOIN users finder         ON finder.user_id = found_item.user_id
               LEFT JOIN item_image img  ON img.item_id = found_item.item_id AND img.is_primary = TRUE
               WHERE m.lost_item_id = $1
               ORDER BY m.confidence_score DESC`
            : `SELECT
                m.match_id, m.confidence_score, m.created_at AS matched_at,
                ms.status_name AS match_status,
                lost_item.item_id      AS lost_item_id,
                lost_item.title        AS lost_title,
                lost_item.description  AS lost_description,
                lost_item.location     AS lost_location,
                owner.user_id          AS owner_user_id,
                owner.name             AS owner_name
               FROM matches m
               JOIN match_status ms  ON ms.status_id = m.status_id
               JOIN items lost_item  ON lost_item.item_id = m.lost_item_id
               JOIN users owner      ON owner.user_id = lost_item.user_id
               WHERE m.found_item_id = $1
               ORDER BY m.confidence_score DESC`;

        const result = await pool.query(matchQuery, [itemId]);

        return res.json({
            success: true,
            item_id: parseInt(itemId),
            item_type: itemType,
            hidden_details: hiddenDetails,
            matches: result.rows
        });

    } catch (error) {
        console.error('[getMatchesForItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch matches' });
    }
}


// ─────────────────────────────────────────────
// PATCH /api/items/:itemId/resolve
// ─────────────────────────────────────────────
async function resolveItem(req, res) {
    const { itemId }  = req.params;
    const { match_id } = req.body;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `UPDATE items
             SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
             WHERE item_id = $1 AND user_id = $2 AND is_active = TRUE
             RETURNING item_id, title`,
            [itemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found or access denied' });
        }

        if (match_id) {
            await pool.query(
                `UPDATE matches SET status_id = 3, updated_at = CURRENT_TIMESTAMP
                 WHERE match_id = $1`,
                [match_id]
            );
        }

        return res.json({ success: true, message: `Item "${result.rows[0].title}" marked as resolved` });

    } catch (error) {
        console.error('[resolveItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to resolve item' });
    }
}


// ─────────────────────────────────────────────
// PATCH /api/items/:itemId/match/:matchId/feedback
// ─────────────────────────────────────────────
async function submitMatchFeedback(req, res) {
    const { itemId, matchId } = req.params;
    const { feedback } = req.body;
    const userId = req.user.user_id;

    if (!['correct','incorrect','unsure'].includes(feedback)) {
        return res.status(400).json({ error: 'feedback must be correct, incorrect, or unsure' });
    }

    try {
        const check = await pool.query(
            `SELECT m.match_id FROM matches m
             JOIN items i ON i.item_id = m.lost_item_id
             WHERE m.match_id = $1 AND m.lost_item_id = $2 AND i.user_id = $3`,
            [matchId, itemId, userId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Match not found or access denied' });
        }

        await pool.query(
            `UPDATE matches SET owner_feedback = $1, updated_at = CURRENT_TIMESTAMP WHERE match_id = $2`,
            [feedback, matchId]
        );

        if (feedback === 'incorrect') {
            await pool.query(`UPDATE matches SET status_id = 4 WHERE match_id = $1`, [matchId]);
        }

        return res.json({ success: true, message: 'Feedback recorded' });

    } catch (error) {
        console.error('[submitMatchFeedback] error:', error.message);
        return res.status(500).json({ error: 'Failed to submit feedback' });
    }
}


// ─────────────────────────────────────────────
// DELETE /api/items/:itemId
// ─────────────────────────────────────────────
async function deleteItem(req, res) {
    const { itemId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `UPDATE items SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE item_id = $1 AND user_id = $2 AND is_active = TRUE
             RETURNING item_id, title`,
            [itemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found or access denied' });
        }

        return res.json({ success: true, message: `Item "${result.rows[0].title}" deleted` });

    } catch (error) {
        console.error('[deleteItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to delete item' });
    }
}


// ─────────────────────────────────────────────
// GET /api/items/categories
// ─────────────────────────────────────────────
async function getCategories(req, res) {
    try {
        const result = await pool.query(
            `SELECT category_id, category_name FROM category ORDER BY category_name ASC`
        );
        return res.json({ success: true, categories: result.rows });
    } catch (error) {
        console.error('[getCategories] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch categories' });
    }
}


module.exports = {
    reportFoundItem,
    reportLostItem,
    getMyItems,
    getItemById,
    getMatchesForItem,
    resolveItem,
    submitMatchFeedback,
    deleteItem,
    getCategories
};
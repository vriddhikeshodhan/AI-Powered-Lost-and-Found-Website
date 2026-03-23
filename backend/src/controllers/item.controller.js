const aiService = require('../services/ai.service');
const { pool } = require('../config/db');
const path = require('path');

// ─────────────────────────────────────────────
// HELPER: Save match + notification to DB
// Called after AI returns matches for any item
// ─────────────────────────────────────────────
async function saveMatchesAndNotify(matches, lostItemId, foundItemId, notifyUserId, itemTitle) {
    for (const match of matches) {
        const actualLostId  = lostItemId  ?? match.lost_item_id;
        const actualFoundId = foundItemId ?? match.found_item_id;

        // Insert match — skip silently if pair already exists
        const matchResult = await pool.query(
            `INSERT INTO matches (lost_item_id, found_item_id, confidence_score, status_id)
             VALUES ($1, $2, $3, 1)
             ON CONFLICT (lost_item_id, found_item_id) DO NOTHING
             RETURNING match_id`,
            [actualLostId, actualFoundId, match.confidence_score]
        );

        // If match was a duplicate (DO NOTHING), matchResult.rows is empty
        // Fetch the existing match_id in that case
        let matchId;
        if (matchResult.rows.length > 0) {
            matchId = matchResult.rows[0].match_id;
        } else {
            const existing = await pool.query(
                `SELECT match_id FROM matches
                 WHERE lost_item_id = $1 AND found_item_id = $2`,
                [actualLostId, actualFoundId]
            );
            if (existing.rows.length === 0) continue; // Should never happen
            matchId = existing.rows[0].match_id;
        }

        // Insert notification for the lost item owner
        await pool.query(
            `INSERT INTO notifications (user_id, item_id, match_id, content, type, email_sent)
             VALUES ($1, $2, $3, $4, 'match_found', FALSE)`,
            [
                notifyUserId,
                actualLostId,
                matchId,
                `A possible match has been found for your lost item: "${itemTitle}". Confidence: ${match.confidence_score}%`
            ]
        );
    }
}


// ─────────────────────────────────────────────
// POST /api/items/found
// Report a found item
// ─────────────────────────────────────────────
async function reportFoundItem(req, res) {
    const { title, description, category_id, location } = req.body;
    const userId = req.user.user_id;

    // Basic validation
    if (!title || !description || !category_id) {
        return res.status(400).json({ error: 'title, description, and category_id are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Save item to DB
        const itemResult = await client.query(
            `INSERT INTO items (title, description, category_id, location, type, user_id, status)
             VALUES ($1, $2, $3, $4, 'Found', $5, 'active')
             RETURNING item_id, title`,
            [title, description, category_id, location || null, userId]
        );
        const { item_id: itemId, title: savedTitle } = itemResult.rows[0];

        // 2. Save image record if a file was uploaded (via multer)
        if (req.file) {
            await client.query(
                `INSERT INTO item_image (item_id, image_url, is_primary, sequence_no)
                 VALUES ($1, $2, TRUE, 1)`,
                [itemId, req.file.filename]
            );
        }

        await client.query('COMMIT');

        // 3. AI pipeline runs in the background — response sent immediately
        // This means the user doesn't wait for embedding/matching to finish
        setImmediate(async () => {
            try {
                // Generate text embedding
                await aiService.generateTextEmbedding(itemId, title, description);

                // Generate image embedding if image was uploaded
                if (req.file) {
                    const imagePath = path.join(__dirname, '../../../uploads', req.file.filename);
                    await aiService.generateImageEmbedding(itemId, imagePath);
                }

                // Run matching against all active lost items
                const matches = await aiService.findMatchesForFoundItem(itemId);

                if (matches.length === 0) {
                    console.log(`No matches found for found item ${itemId}`);
                    return;
                }

                // For each match, save it and notify the lost item owner
                for (const match of matches) {
                    // Get the lost item owner details
                    const ownerResult = await pool.query(
                        `SELECT user_id, title FROM items WHERE item_id = $1`,
                        [match.lost_item_id]
                    );
                    if (ownerResult.rows.length === 0) continue;

                    const { user_id: ownerId, title: lostTitle } = ownerResult.rows[0];

                    await saveMatchesAndNotify(
                        [match],           // single match wrapped in array
                        match.lost_item_id,
                        itemId,
                        ownerId,           // notify the person who LOST the item
                        lostTitle
                    );
                }

                console.log(`[AI] Saved ${matches.length} match(es) for found item ${itemId}`);

            } catch (aiErr) {
                // AI failure must NOT affect item storage — already committed
                console.error(`[AI] Pipeline failed for found item ${itemId}:`, aiErr.message);
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Found item reported successfully. AI matching is running in the background.',
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
// Report a lost item
// ─────────────────────────────────────────────
async function reportLostItem(req, res) {
    const { title, description, category_id, location, hidden_details } = req.body;
    const userId = req.user.user_id;

    // Basic validation
    if (!title || !description || !category_id) {
        return res.status(400).json({ error: 'title, description, and category_id are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Save item to DB
        const itemResult = await client.query(
            `INSERT INTO items
             (title, description, category_id, location, type, user_id, hidden_details, status)
             VALUES ($1, $2, $3, $4, 'Lost', $5, $6, 'active')
             RETURNING item_id, title`,
            [title, description, category_id, location || null, userId, hidden_details || null]
        );
        const { item_id: itemId, title: savedTitle } = itemResult.rows[0];

        // 2. Save image record if uploaded
        if (req.file) {
            await client.query(
                `INSERT INTO item_image (item_id, image_url, is_primary, sequence_no)
                 VALUES ($1, $2, TRUE, 1)`,
                [itemId, req.file.filename]
            );
        }

        await client.query('COMMIT');

        // 3. Background AI pipeline
        setImmediate(async () => {
            try {
                // Generate text embedding
                await aiService.generateTextEmbedding(itemId, title, description);

                // Generate image embedding if image uploaded
                if (req.file) {
                    const imagePath = path.join(__dirname, '../../../uploads', req.file.filename);
                    await aiService.generateImageEmbedding(itemId, imagePath);
                }

                // Run matching against all active found items
                const matches = await aiService.findMatchesForLostItem(itemId);

                if (matches.length === 0) {
                    console.log(`[AI] No matches found for lost item ${itemId}. Stored for future matching.`);
                    return;
                }

                // Notify the current user (the loser) about found matches
                await saveMatchesAndNotify(
                    matches,
                    itemId,    // lostItemId is fixed — this is the item just reported
                    null,      // foundItemId comes from each match object
                    userId,    // notify the person who reported the lost item
                    savedTitle
                );

                console.log(`[AI] Saved ${matches.length} match(es) for lost item ${itemId}`);

            } catch (aiErr) {
                console.error(`[AI] Pipeline failed for lost item ${itemId}:`, aiErr.message);
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Lost item reported successfully. AI matching is running in the background.',
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
// Returns all items reported by the logged-in user
// ─────────────────────────────────────────────
async function getMyItems(req, res) {
    const userId = req.user.user_id;
    const { type, status, page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [userId];
    const filters = [`i.user_id = $1`, `i.is_active = TRUE`];

    // Optional filter by type (Lost / Found)
    if (type && ['Lost', 'Found'].includes(type)) {
        params.push(type);
        filters.push(`i.type = $${params.length}`);
    }

    // Optional filter by status
    if (status && ['active', 'resolved', 'expired'].includes(status)) {
        params.push(status);
        filters.push(`i.status = $${params.length}`);
    }

    const whereClause = filters.join(' AND ');

    try {
        // Total count for pagination
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM items i WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Fetch items with category name and primary image
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
                i.expires_at,
                i.hidden_details,
                c.category_name,
                img.image_url AS primary_image,
                (
                    SELECT COUNT(*) FROM matches m
                    WHERE m.lost_item_id = i.item_id OR m.found_item_id = i.item_id
                ) AS match_count
             FROM items i
             JOIN category c ON c.category_id = i.category_id
             LEFT JOIN item_image img ON img.item_id = i.item_id AND img.is_primary = TRUE
             WHERE ${whereClause}
             ORDER BY i.date_reported DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(total / parseInt(limit)),
            items: result.rows
        });

    } catch (error) {
        console.error('[getMyItems] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch items' });
    }
}


// ─────────────────────────────────────────────
// GET /api/items/:itemId
// Get a single item's full details
// ─────────────────────────────────────────────
async function getItemById(req, res) {
    const { itemId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `SELECT
                i.item_id,
                i.title,
                i.description,
                i.type,
                i.status,
                i.location,
                i.date_reported,
                i.expires_at,
                c.category_name,
                u.name AS reported_by,
                -- Only show hidden_details to the item owner
                CASE WHEN i.user_id = $2 THEN i.hidden_details ELSE NULL END AS hidden_details,
                -- Aggregate all images for this item
                json_agg(
                    json_build_object(
                        'image_id', img.image_id,
                        'image_url', img.image_url,
                        'is_primary', img.is_primary,
                        'sequence_no', img.sequence_no
                    ) ORDER BY img.sequence_no
                ) FILTER (WHERE img.image_id IS NOT NULL) AS images
             FROM items i
             JOIN category c ON c.category_id = i.category_id
             JOIN users u ON u.user_id = i.user_id
             LEFT JOIN item_image img ON img.item_id = i.item_id
             WHERE i.item_id = $1 AND i.is_active = TRUE
             GROUP BY i.item_id, c.category_name, u.name`,
            [itemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        return res.json({ success: true, item: result.rows[0] });

    } catch (error) {
        console.error('[getItemById] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch item' });
    }
}


// ─────────────────────────────────────────────
// GET /api/items/:itemId/matches
// Get all AI matches for a specific lost item
// Only the item owner can see matches for their item
// ─────────────────────────────────────────────
async function getMatchesForItem(req, res) {
    const { itemId } = req.params;
    const userId = req.user.user_id;

    try {
        // First verify this item belongs to the requesting user
        const ownerCheck = await pool.query(
            `SELECT item_id, type FROM items WHERE item_id = $1 AND user_id = $2 AND is_active = TRUE`,
            [itemId, userId]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Item not found or access denied' });
        }

        const itemType = ownerCheck.rows[0].type;

        // Query matches differently depending on whether it's a lost or found item
        // Lost item owner sees found item matches
        // Found item — matches are visible to lost item owners, not finder
        const matchQuery = itemType === 'Lost'
        ? `SELECT
            m.match_id,
            m.confidence_score,
            m.created_at AS matched_at,
            ms.status_name AS match_status,
            m.owner_feedback,
            found_item.item_id   AS found_item_id,
            found_item.title     AS found_title,
            found_item.description AS found_description,
            found_item.location  AS found_location,
            found_item.date_reported AS found_date,
            finder.user_id       AS finder_user_id,
            finder.name          AS finder_name,
            img.image_url        AS found_image
            FROM matches m
            JOIN match_status ms ON ms.status_id = m.status_id
            JOIN items found_item ON found_item.item_id = m.found_item_id
            JOIN users finder ON finder.user_id = found_item.user_id
            LEFT JOIN item_image img ON img.item_id = found_item.item_id AND img.is_primary = TRUE
            WHERE m.lost_item_id = $1
            ORDER BY m.confidence_score DESC`
        : `SELECT
            m.match_id,
            m.confidence_score,
            m.created_at AS matched_at,
            ms.status_name AS match_status,
            lost_item.item_id   AS lost_item_id,
            lost_item.title     AS lost_title,
            lost_item.description AS lost_description,
            lost_item.location  AS lost_location,
            owner.user_id       AS owner_user_id,
            owner.name          AS owner_name
            FROM matches m
            JOIN match_status ms ON ms.status_id = m.status_id
            JOIN items lost_item ON lost_item.item_id = m.lost_item_id
            JOIN users owner ON owner.user_id = lost_item.user_id
            WHERE m.found_item_id = $1
            ORDER BY m.confidence_score DESC`;

        const result = await pool.query(matchQuery, [itemId]);

        return res.json({
            success: true,
            item_id: parseInt(itemId),
            item_type: itemType,
            matches: result.rows
        });

    } catch (error) {
        console.error('[getMatchesForItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch matches' });
    }
}


// ─────────────────────────────────────────────
// PATCH /api/items/:itemId/resolve
// Mark an item as resolved (returned to owner)
// Only the item owner can resolve their item
// ─────────────────────────────────────────────
async function resolveItem(req, res) {
    const { itemId } = req.params;
    const { match_id } = req.body;  // Optional: which match led to resolution
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

        // If a match_id was provided, update the match status to 'verified' (status_id = 3)
        if (match_id) {
            await pool.query(
                `UPDATE matches SET status_id = 3, updated_at = CURRENT_TIMESTAMP
                 WHERE match_id = $1`,
                [match_id]
            );
        }

        return res.json({
            success: true,
            message: `Item "${result.rows[0].title}" marked as resolved`
        });

    } catch (error) {
        console.error('[resolveItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to resolve item' });
    }
}


// ─────────────────────────────────────────────
// PATCH /api/items/:itemId/match/:matchId/feedback
// Owner provides feedback on a match (correct / incorrect / unsure)
// Used to improve AI threshold tuning
// ─────────────────────────────────────────────
async function submitMatchFeedback(req, res) {
    const { itemId, matchId } = req.params;
    const { feedback } = req.body;
    const userId = req.user.user_id;

    const validFeedback = ['correct', 'incorrect', 'unsure'];
    if (!validFeedback.includes(feedback)) {
        return res.status(400).json({ error: 'feedback must be correct, incorrect, or unsure' });
    }

    try {
        // Verify the user owns the lost item in this match
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
            `UPDATE matches
             SET owner_feedback = $1, updated_at = CURRENT_TIMESTAMP
             WHERE match_id = $2`,
            [feedback, matchId]
        );

        // If user says incorrect, update match status to rejected (status_id = 4)
        if (feedback === 'incorrect') {
            await pool.query(
                `UPDATE matches SET status_id = 4 WHERE match_id = $1`,
                [matchId]
            );
        }

        return res.json({ success: true, message: 'Feedback recorded' });

    } catch (error) {
        console.error('[submitMatchFeedback] error:', error.message);
        return res.status(500).json({ error: 'Failed to submit feedback' });
    }
}


// ─────────────────────────────────────────────
// DELETE /api/items/:itemId
// Soft-delete an item (sets is_active = FALSE)
// Only the item owner can delete their item
// ─────────────────────────────────────────────
async function deleteItem(req, res) {
    const { itemId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `UPDATE items
             SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE item_id = $1 AND user_id = $2 AND is_active = TRUE
             RETURNING item_id, title`,
            [itemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found or access denied' });
        }

        return res.json({
            success: true,
            message: `Item "${result.rows[0].title}" deleted`
        });

    } catch (error) {
        console.error('[deleteItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to delete item' });
    }
}


// ─────────────────────────────────────────────
// GET /api/items/categories
// Return all available categories
// Public — no auth needed
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
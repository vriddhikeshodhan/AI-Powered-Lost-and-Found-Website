const { pool } = require('../config/db');


// ─────────────────────────────────────────────
// GET /api/admin/stats
// Platform-wide overview numbers
// ─────────────────────────────────────────────
async function getStats(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users)                                         AS total_users,
                (SELECT COUNT(*) FROM items WHERE is_active = TRUE)                  AS total_items,
                (SELECT COUNT(*) FROM items WHERE type = 'Lost'  AND is_active = TRUE) AS total_lost,
                (SELECT COUNT(*) FROM items WHERE type = 'Found' AND is_active = TRUE) AS total_found,
                (SELECT COUNT(*) FROM items WHERE status = 'resolved')               AS total_resolved,
                (SELECT COUNT(*) FROM matches)                                        AS total_matches,
                (SELECT COUNT(*) FROM matches WHERE owner_feedback = 'correct')      AS confirmed_matches,
                (SELECT COUNT(*) FROM users WHERE is_verified = TRUE)                AS verified_users
        `);

        return res.json({ success: true, stats: result.rows[0] });
    } catch (error) {
        console.error('[getStats] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
}


// ─────────────────────────────────────────────
// GET /api/admin/users
// All users with pagination + optional search
// ─────────────────────────────────────────────
async function getUsers(req, res) {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        const params = [`%${search}%`, parseInt(limit), offset];

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM users
             WHERE name ILIKE $1 OR email ILIKE $1`,
            [`%${search}%`]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT
                u.user_id,
                u.name,
                u.email,
                u.is_verified,
                u.created_at,
                r.role_name,
                (SELECT COUNT(*) FROM items i WHERE i.user_id = u.user_id AND i.is_active = TRUE) AS item_count
             FROM users u
             JOIN roles r ON r.role_id = u.role_id
             WHERE u.name ILIKE $1 OR u.email ILIKE $1
             ORDER BY u.created_at DESC
             LIMIT $2 OFFSET $3`,
            params
        );

        return res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(total / parseInt(limit)),
            users: result.rows
        });
    } catch (error) {
        console.error('[getUsers] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
}


// ─────────────────────────────────────────────
// GET /api/admin/items
// All items with pagination + optional filters
// ─────────────────────────────────────────────
async function getItems(req, res) {
    const { page = 1, limit = 20, type, status, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const params = [`%${search}%`];
    const filters = [`(i.title ILIKE $1 OR i.description ILIKE $1)`];

    if (type && ['Lost', 'Found'].includes(type)) {
        params.push(type);
        filters.push(`i.type = $${params.length}`);
    }
    if (status && ['active', 'resolved', 'expired'].includes(status)) {
        params.push(status);
        filters.push(`i.status = $${params.length}`);
    }

    const whereClause = filters.join(' AND ');

    try {
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM items i WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(parseInt(limit), offset);
        const result = await pool.query(
            `SELECT
                i.item_id,
                i.title,
                i.type,
                i.status,
                i.location,
                i.date_reported,
                i.is_active,
                c.category_name,
                u.name  AS reported_by,
                u.email AS reported_by_email,
                (SELECT COUNT(*) FROM matches m
                 WHERE m.lost_item_id = i.item_id OR m.found_item_id = i.item_id) AS match_count
             FROM items i
             JOIN category c ON c.category_id = i.category_id
             JOIN users u ON u.user_id = i.user_id
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
        console.error('[getItems] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch items' });
    }
}


// ─────────────────────────────────────────────
// PATCH /api/admin/users/:userId/deactivate
// Soft-deactivate a user (sets is_verified = false as a lockout flag)
// Does NOT delete — preserves data integrity
// ─────────────────────────────────────────────
async function deactivateUser(req, res) {
    const { userId } = req.params;
    const adminId = req.user.user_id;

    // Prevent admin from deactivating themselves
    if (parseInt(userId) === adminId) {
        return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    try {
        // Prevent deactivating another admin
        const roleCheck = await pool.query(
            `SELECT role_id, name FROM users WHERE user_id = $1`,
            [userId]
        );
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (roleCheck.rows[0].role_id === 2) {
            return res.status(403).json({ error: 'Cannot deactivate another admin' });
        }

        await pool.query(
            `UPDATE users SET is_verified = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId]
        );

        return res.json({
            success: true,
            message: `User "${roleCheck.rows[0].name}" has been deactivated`
        });
    } catch (error) {
        console.error('[deactivateUser] error:', error.message);
        return res.status(500).json({ error: 'Failed to deactivate user' });
    }
}


// ─────────────────────────────────────────────
// PATCH /api/admin/users/:userId/reactivate
// Re-activate a previously deactivated user
// ─────────────────────────────────────────────
async function reactivateUser(req, res) {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `UPDATE users SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1
             RETURNING name`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({
            success: true,
            message: `User "${result.rows[0].name}" has been reactivated`
        });
    } catch (error) {
        console.error('[reactivateUser] error:', error.message);
        return res.status(500).json({ error: 'Failed to reactivate user' });
    }
}


// ─────────────────────────────────────────────
// PATCH /api/admin/items/:itemId/resolve
// Force-resolve any item regardless of owner
// ─────────────────────────────────────────────
async function forceResolveItem(req, res) {
    const { itemId } = req.params;

    try {
        const result = await pool.query(
            `UPDATE items
             SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
             WHERE item_id = $1 AND is_active = TRUE
             RETURNING title`,
            [itemId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found or already resolved' });
        }

        return res.json({
            success: true,
            message: `Item "${result.rows[0].title}" marked as resolved`
        });
    } catch (error) {
        console.error('[forceResolveItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to resolve item' });
    }
}


// ─────────────────────────────────────────────
// DELETE /api/admin/items/:itemId
// Hard soft-delete any item (sets is_active = FALSE)
// ─────────────────────────────────────────────
async function deleteItem(req, res) {
    const { itemId } = req.params;

    try {
        const result = await pool.query(
            `UPDATE items
             SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE item_id = $1
             RETURNING title`,
            [itemId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        return res.json({
            success: true,
            message: `Item "${result.rows[0].title}" removed from platform`
        });
    } catch (error) {
        console.error('[deleteItem] error:', error.message);
        return res.status(500).json({ error: 'Failed to delete item' });
    }
}


module.exports = {
    getStats,
    getUsers,
    getItems,
    deactivateUser,
    reactivateUser,
    forceResolveItem,
    deleteItem
};

const { pool } = require("../config/db");

// ─────────────────────────────────────────────
// GET /api/notifications
// Returns all notifications for logged-in user
// ─────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
    const userId = req.user.user_id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
            [userId]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT
                n.notification_id,
                n.content,
                n.type,
                n.is_read,
                n.sent_at,
                n.match_id,
                n.item_id,
                i.title AS item_title
             FROM notifications n
             LEFT JOIN items i ON i.item_id = n.item_id
             WHERE n.user_id = $1
             ORDER BY n.sent_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, parseInt(limit), offset]
        );

        return res.json({
            success: true,
            total,
            unread: result.rows.filter(n => !n.is_read).length,
            notifications: result.rows
        });

    } catch (err) {
        console.error("[getNotifications] error:", err.message);
        return res.status(500).json({ error: "Failed to fetch notifications" });
    }
};


// ─────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE notification_id = $1 AND user_id = $2
             RETURNING notification_id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        return res.json({ success: true });

    } catch (err) {
        console.error("[markAsRead] error:", err.message);
        return res.status(500).json({ error: "Failed to update notification" });
    }
};


// ─────────────────────────────────────────────
// PATCH /api/notifications/read-all
// Mark all notifications as read for this user
// ─────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.user_id;

    try {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE
             WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );

        return res.json({ success: true, message: "All notifications marked as read" });

    } catch (err) {
        console.error("[markAllAsRead] error:", err.message);
        return res.status(500).json({ error: "Failed to update notifications" });
    }
};


// ─────────────────────────────────────────────
// GET /api/notifications/unread-count
// Returns count of unread notifications
// Used for the notification badge in the navbar
// ─────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `SELECT COUNT(*) FROM notifications
             WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );

        return res.json({
            success: true,
            unread_count: parseInt(result.rows[0].count)
        });

    } catch (err) {
        console.error("[getUnreadCount] error:", err.message);
        return res.status(500).json({ error: "Failed to get unread count" });
    }
};
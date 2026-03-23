const { pool } = require('../config/db');

/* ────────────────────────────────────────────
   GET /api/chat/active
──────────────────────────────────────────── */
const getActiveChats = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `SELECT
                m.match_id,
                m.confidence_score,
                ms.status_name          AS match_status,
                li.item_id              AS lost_item_id,
                li.title                AS lost_item_title,
                lu.user_id              AS lost_user_id,
                lu.name                 AS lost_user_name,
                fi.item_id              AS found_item_id,
                fi.title                AS found_item_title,
                fu.user_id              AS found_user_id,
                fu.name                 AS found_user_name,
                last_msg.content        AS last_message,
                last_msg.sent_at        AS last_message_at,
                (
                    SELECT COUNT(*)
                    FROM messages msg2
                    WHERE msg2.match_id    = m.match_id
                      AND msg2.receiver_id = $1
                      AND msg2.is_read     = FALSE
                ) AS unread_count
             FROM matches m
             JOIN match_status ms ON ms.status_id = m.status_id
             JOIN items li  ON li.item_id  = m.lost_item_id
             JOIN items fi  ON fi.item_id  = m.found_item_id
             JOIN users lu  ON lu.user_id  = li.user_id
             JOIN users fu  ON fu.user_id  = fi.user_id
             LEFT JOIN LATERAL (
                 SELECT content, sent_at
                 FROM messages
                 WHERE match_id = m.match_id
                 ORDER BY sent_at DESC
                 LIMIT 1
             ) last_msg ON TRUE
             WHERE
                (lu.user_id = $1 OR fu.user_id = $1)
                AND (
                    m.owner_feedback = 'correct'
                    OR EXISTS (SELECT 1 FROM messages msg3 WHERE msg3.match_id = m.match_id)
                )
             ORDER BY COALESCE(last_msg.sent_at, m.created_at) DESC`,
            [userId]
        );

        res.json({ success: true, chats: result.rows });
    } catch (err) {
        console.error('getActiveChats error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch chats' });
    }
};

/* ────────────────────────────────────────────
   GET /api/chat/:matchId
──────────────────────────────────────────── */
const getChatHistory = async (req, res) => {
    const userId  = req.user.user_id;
    const matchId = parseInt(req.params.matchId);

    try {
        // Verify user is a participant
        const check = await pool.query(
            `SELECT m.match_id
             FROM matches m
             JOIN items li ON li.item_id = m.lost_item_id
             JOIN items fi ON fi.item_id = m.found_item_id
             WHERE m.match_id = $1 AND (li.user_id = $2 OR fi.user_id = $2)`,
            [matchId, userId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const result = await pool.query(
            `SELECT message_id, match_id, sender_id, receiver_id, content, is_read, sent_at
             FROM messages
             WHERE match_id = $1
             ORDER BY sent_at ASC`,
            [matchId]
        );

        // Mark received messages as read
        await pool.query(
            `UPDATE messages SET is_read = TRUE
             WHERE match_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
            [matchId, userId]
        );

        res.json({ success: true, messages: result.rows });
    } catch (err) {
        console.error('getChatHistory error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

/* ────────────────────────────────────────────
   GET /api/chat/:matchId/unread
──────────────────────────────────────────── */
const getUnreadCount = async (req, res) => {
    const userId  = req.user.user_id;
    const matchId = parseInt(req.params.matchId);

    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS count FROM messages
             WHERE match_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
            [matchId, userId]
        );
        res.json({ success: true, count: parseInt(result.rows[0].count) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
};

module.exports = { getActiveChats, getChatHistory, getUnreadCount };

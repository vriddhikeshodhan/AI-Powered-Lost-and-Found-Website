/*
require('dotenv').config();
const { startExpiryJob } = require("./jobs/expiry.job");
const http    = require('http');
const { Server } = require('socket.io');
const app     = require('./app');        
const { pool } = require('./config/db'); 

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // User joins the room for a specific match conversation
    socket.on('join_match', (matchId) => {
        const room = `match_${matchId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // User sends a message
    socket.on('send_message', async ({ matchId, senderId, receiverId, content }) => {
        console.log('send_message:', { matchId, senderId, receiverId, content });

        // Validate inputs before hitting DB
        if (!matchId || !senderId || !receiverId || !content) {
            console.error('send_message: missing fields', { matchId, senderId, receiverId, content });
            socket.emit('message_error', { error: 'Missing required fields' });
            return;
        }

        try {
            const result = await pool.query(
                `INSERT INTO messages (match_id, sender_id, receiver_id, content)
                 VALUES ($1, $2, $3, $4)
                 RETURNING message_id, match_id, sender_id, receiver_id, content, is_read, sent_at`,
                [matchId, senderId, receiverId, content]
            );

            const message = result.rows[0];
            console.log('Message saved to DB:', message.message_id);

            // Emit to everyone in the room — sender gets it back to replace optimistic entry
            io.to(`match_${matchId}`).emit('receive_message', message);

        } catch (err) {
            console.error('DB insert error:', err.message);
            console.error(err.stack);
            socket.emit('message_error', { error: 'Failed to save message' });
        }
    });

    socket.on('typing', ({ matchId, userId }) => {
        socket.to(`match_${matchId}`).emit('user_typing', { userId });
    });

    socket.on('stop_typing', ({ matchId, userId }) => {
        socket.to(`match_${matchId}`).emit('user_stop_typing', { userId });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpiryJob();
});

module.exports = { server, io };
*/
require('dotenv').config();
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD, '| value:', process.env.DB_PASSWORD);
const http         = require('http');
const { Server }   = require('socket.io');
const app          = require('./app');
const { pool }     = require('./config/db');
const emailService = require('./services/email.service');
const { startExpiryJob } = require('./jobs/expiry.job');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin:  process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Socket.io
// ─────────────────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join the chat room for a specific match
    socket.on('join_match', (matchId) => {
        const room = `match_${matchId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Handle a new message
    socket.on('send_message', async ({ matchId, senderId, receiverId, content }) => {
        console.log('send_message:', { matchId, senderId, receiverId, content });

        if (!matchId || !senderId || !receiverId || !content) {
            console.error('send_message: missing fields');
            socket.emit('message_error', { error: 'Missing required fields' });
            return;
        }

        try {
            // 1. Save message to DB
            const result = await pool.query(
                `INSERT INTO messages (match_id, sender_id, receiver_id, content)
                 VALUES ($1, $2, $3, $4)
                 RETURNING message_id, match_id, sender_id, receiver_id, content, is_read, sent_at`,
                [matchId, senderId, receiverId, content]
            );
            const message = result.rows[0];
            console.log('Message saved to DB:', message.message_id);

            // 2. Broadcast to everyone in the room
            io.to(`match_${matchId}`).emit('receive_message', message);

            // 3. Send email to receiver on their FIRST message in this conversation
            //    (don't spam an email on every message — only the first one)
            try {
                const msgCountRes = await pool.query(
                    `SELECT COUNT(*) AS count FROM messages
                     WHERE match_id = $1 AND receiver_id = $2`,
                    [matchId, receiverId]
                );
                const isFirstMessage = parseInt(msgCountRes.rows[0].count) === 1;

                if (isFirstMessage) {
                    // Get receiver details
                    const receiverRes = await pool.query(
                        `SELECT name, email FROM users WHERE user_id = $1`,
                        [receiverId]
                    );
                    // Get sender details
                    const senderRes = await pool.query(
                        `SELECT name FROM users WHERE user_id = $1`,
                        [senderId]
                    );
                    // Get item title from the match
                    const matchRes = await pool.query(
                        `SELECT li.title AS lost_title
                         FROM matches m
                         JOIN items li ON li.item_id = m.lost_item_id
                         WHERE m.match_id = $1`,
                        [matchId]
                    );

                    if (receiverRes.rows.length > 0 && senderRes.rows.length > 0) {
                        const finderName = receiverRes.rows[0].name;
                        const finderEmail = receiverRes.rows[0].email;
                        const ownerName  = senderRes.rows[0].name;
                        const itemTitle  = matchRes.rows[0]?.lost_title || 'your found item';

                        await emailService.sendChatNotificationEmail(
                            finderEmail,
                            finderName,
                            ownerName,
                            itemTitle
                        );
                        console.log(`[Socket] Chat notification email sent to ${finderEmail}`);
                    }
                }
            } catch (emailErr) {
                // Email failure is non-fatal — message still delivered via socket
                console.error('[Socket] Chat email failed:', emailErr.message);
            }

        } catch (err) {
            console.error('DB insert error:', err.message);
            console.error(err.stack);
            socket.emit('message_error', { error: 'Failed to save message' });
        }
    });

    socket.on('typing', ({ matchId, userId }) => {
        socket.to(`match_${matchId}`).emit('user_typing', { userId });
    });

    socket.on('stop_typing', ({ matchId, userId }) => {
        socket.to(`match_${matchId}`).emit('user_stop_typing', { userId });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpiryJob();
});

module.exports = { server, io };
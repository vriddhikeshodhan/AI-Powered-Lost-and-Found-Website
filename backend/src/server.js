require('dotenv').config();
const http    = require('http');
const { Server } = require('socket.io');
const app     = require('./app');           // your Express app
const { pool } = require('./config/db');   // ← DB pool — critical import

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

/* ── Socket.io ───────────────────────────────── */
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

/* ── Start server ────────────────────────────── */
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { server, io };

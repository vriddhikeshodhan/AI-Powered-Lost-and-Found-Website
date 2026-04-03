// backend/src/jobs/expiry.job.js
//
// Runs every night at midnight (configurable).
// Finds all active items whose expires_at has passed and:
//   1. Sets status = 'expired'
//   2. Sets is_active = FALSE  (removes from match candidates)
//   3. Creates a notification for the item owner
//
// Uses node-cron — install with: npm install node-cron

const cron  = require("node-cron");
const { pool } = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// Core expiry function — exported so it can be called manually too
// ─────────────────────────────────────────────────────────────────────────────
async function runExpiryJob() {
    const startedAt = new Date().toISOString();
    console.log(`[ExpiryJob] Starting at ${startedAt}`);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Step 1: Find all items that are overdue and still active
        const expired = await client.query(`
            SELECT item_id, user_id, title, type
            FROM items
            WHERE is_active  = TRUE
              AND status     = 'active'
              AND expires_at IS NOT NULL
              AND expires_at < NOW()
        `);

        if (expired.rows.length === 0) {
            console.log("[ExpiryJob] No items to expire. Done.");
            await client.query("COMMIT");
            return { expired: 0 };
        }

        const ids = expired.rows.map(r => r.item_id);

        // Step 2: Bulk-update all overdue items
        await client.query(`
            UPDATE items
            SET status     = 'expired',
                is_active  = FALSE,
                updated_at = CURRENT_TIMESTAMP
            WHERE item_id = ANY($1::int[])
        `, [ids]);

        // Step 3: Insert a notification for each owner
        for (const item of expired.rows) {
            await client.query(`
                INSERT INTO notifications
                    (user_id, item_id, match_id, content, type, email_sent)
                VALUES ($1, $2, NULL, $3, 'item_expired', FALSE)
            `, [
                item.user_id,
                item.item_id,
                `Your ${item.type.toLowerCase()} item report "${item.title}" has expired after 30 days and is no longer active. You can report it again if it's still missing.`
            ]);
        }

        await client.query("COMMIT");

        console.log(`[ExpiryJob] Expired ${ids.length} item(s): ${ids.join(", ")}`);
        return { expired: ids.length };

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("[ExpiryJob] Failed:", err.message);
        return { expired: 0, error: err.message };
    } finally {
        client.release();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule — runs every day at midnight
// Cron syntax: second(opt) minute hour day month weekday
// "0 0 * * *" = 00:00 every day
// ─────────────────────────────────────────────────────────────────────────────
function startExpiryJob() {
    cron.schedule("0 0 * * *", async () => {
        await runExpiryJob();
    }, {
        timezone: "Asia/Kolkata",   // ← change to your campus timezone
    });

    console.log("[ExpiryJob] Scheduled — runs daily at midnight.");
}

module.exports = { startExpiryJob, runExpiryJob };

const { pool }    = require("../config/db");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const emailService = require("../services/email.service");

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "name, email and password are required" });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    try {
        // Check if email already exists
        const existing = await pool.query(
            "SELECT user_id FROM users WHERE email = $1",
            [email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 12);

        // Generate email verification token (random 32-byte hex string)
        const verification_token = crypto.randomBytes(32).toString("hex");
        const verification_token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert user — role_id 1 = USER
        const result = await pool.query(
            `INSERT INTO users
             (name, email, password_hash, role_id, is_verified, verification_token, verification_token_expiry)
             VALUES ($1, $2, $3, 1, FALSE, $4, $5)
             RETURNING user_id, name, email`,
            [name, email, password_hash, verification_token, verification_token_expiry]
        );

        const newUser = result.rows[0];

        // Send verification email
        await emailService.sendVerificationEmail(email, name, verification_token);

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
            user_id: newUser.user_id
        });

    } catch (err) {
        console.error("[registerUser] error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};


// ─────────────────────────────────────────────
// GET /api/auth/verify/:token
// ─────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const result = await pool.query(
            `SELECT user_id, verification_token_expiry
             FROM users
             WHERE verification_token = $1 AND is_verified = FALSE`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid or already used verification link" });
        }

        const user = result.rows[0];

        // Check if token has expired
        if (new Date() > new Date(user.verification_token_expiry)) {
            return res.status(400).json({ message: "Verification link has expired. Please register again or request a new link." });
        }

        // Mark as verified and clear token
        await pool.query(
            `UPDATE users
             SET is_verified = TRUE,
                 verification_token = NULL,
                 verification_token_expiry = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [user.user_id]
        );

        return res.json({ success: true, message: "Email verified successfully. You can now log in." });

    } catch (err) {
        console.error("[verifyEmail] error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};


// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result.rows[0];

        // Check email is verified before allowing login
        if (!user.is_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in. Check your inbox."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Sign JWT — include role_id so middleware can check admin access
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role_id: user.role_id
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role_id: user.role_id
            }
        });

    } catch (err) {
        console.error("[loginUser] error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};


// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "email is required" });
    }

    try {
        const result = await pool.query(
            "SELECT user_id, name FROM users WHERE email = $1 AND is_verified = TRUE",
            [email]
        );

        // Always return success even if email not found — prevents email enumeration
        if (result.rows.length === 0) {
            return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
        }

        const user = result.rows[0];

        const reset_token = crypto.randomBytes(32).toString("hex");
        const reset_token_expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            `UPDATE users
             SET reset_token = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3`,
            [reset_token, reset_token_expiry, user.user_id]
        );

        await emailService.sendPasswordResetEmail(email, user.name, reset_token);

        return res.json({ success: true, message: "If this email exists, a reset link has been sent." });

    } catch (err) {
        console.error("[forgotPassword] error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};


// ─────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
        return res.status(400).json({ message: "token and new_password are required" });
    }

    if (new_password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    try {
        const result = await pool.query(
            `SELECT user_id, reset_token_expiry
             FROM users
             WHERE reset_token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset link" });
        }

        const user = result.rows[0];

        if (new Date() > new Date(user.reset_token_expiry)) {
            return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
        }

        const password_hash = await bcrypt.hash(new_password, 12);

        await pool.query(
            `UPDATE users
             SET password_hash = $1,
                 reset_token = NULL,
                 reset_token_expiry = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2`,
            [password_hash, user.user_id]
        );

        return res.json({ success: true, message: "Password reset successfully. You can now log in." });

    } catch (err) {
        console.error("[resetPassword] error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};


// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns current logged-in user's profile
// ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, name, email, role_id, is_verified, created_at
             FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ success: true, user: result.rows[0] });

    } catch (err) {
        console.error("[getMe] error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};
const nodemailer = require("nodemailer");

// ─────────────────────────────────────────────
// Create reusable transporter
// Uses Gmail — requires an App Password (not your account password)
// To generate: Google Account → Security → 2FA → App Passwords
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const APP_NAME = "Lost & Found";


// ─────────────────────────────────────────────
// Send email verification link after registration
// ─────────────────────────────────────────────
async function sendVerificationEmail(toEmail, name, token) {
    const verifyUrl = `${FRONTEND_URL}/verify-email/${token}`;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Verify your ${APP_NAME} account`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to ${APP_NAME}, ${name}!</h2>
                <p>Please verify your email address to activate your account.</p>
                <a href="${verifyUrl}"
                   style="display:inline-block; padding:12px 24px; background:#2563eb;
                          color:white; text-decoration:none; border-radius:6px; margin:16px 0;">
                    Verify Email
                </a>
                <p style="color:#666; font-size:14px;">
                    This link expires in 24 hours.<br>
                    If you didn't register, ignore this email.
                </p>
            </div>
        `
    });
}


// ─────────────────────────────────────────────
// Send match notification email to lost item owner
// ─────────────────────────────────────────────
async function sendMatchNotificationEmail(toEmail, name, lostItemTitle, confidenceScore, matchId) {
    const matchUrl = `${FRONTEND_URL}/matches/${matchId}`;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Possible match found for your lost item: ${lostItemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Good news, ${name}!</h2>
                <p>A potential match was found for your lost item:</p>
                <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin:16px 0;">
                    <strong>${lostItemTitle}</strong><br>
                    <span style="color:#16a34a;">Match confidence: ${confidenceScore}%</span>
                </div>
                <a href="${matchUrl}"
                   style="display:inline-block; padding:12px 24px; background:#2563eb;
                          color:white; text-decoration:none; border-radius:6px;">
                    View Match
                </a>
                <p style="color:#666; font-size:14px; margin-top:16px;">
                    Log in to view the details and start a chat with the finder.
                </p>
            </div>
        `
    });
}


// ─────────────────────────────────────────────
// Send password reset email
// ─────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, name, token) {
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Reset your ${APP_NAME} password`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>Hi ${name}, we received a request to reset your password.</p>
                <a href="${resetUrl}"
                   style="display:inline-block; padding:12px 24px; background:#dc2626;
                          color:white; text-decoration:none; border-radius:6px; margin:16px 0;">
                    Reset Password
                </a>
                <p style="color:#666; font-size:14px;">
                    This link expires in 1 hour.<br>
                    If you didn't request this, ignore this email. Your password won't change.
                </p>
            </div>
        `
    });
}


module.exports = {
    sendVerificationEmail,
    sendMatchNotificationEmail,
    sendPasswordResetEmail
};
/*
const nodemailer = require("nodemailer");

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
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

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
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

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
*/
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// BUG FIX: was hardcoded to localhost:5173 (Vite default).
// Your frontend runs on localhost:3000 (Create React App).
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const APP_NAME     = "Lost & Found";


// ─────────────────────────────────────────────
// Verification email
// ─────────────────────────────────────────────
async function sendVerificationEmail(toEmail, name, token) {
    const verifyUrl = `${FRONTEND_URL}/verify-email/${token}`;

    await transporter.sendMail({
        from:    `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `Verify your ${APP_NAME} account`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="color:#15803d;">Welcome to ${APP_NAME}, ${name}!</h2>
                <p>Please verify your email address to activate your account.</p>
                <a href="${verifyUrl}"
                   style="display:inline-block;padding:12px 24px;background:#22c55e;
                          color:white;text-decoration:none;border-radius:6px;margin:16px 0;font-weight:bold;">
                    Verify Email
                </a>
                <p style="color:#666;font-size:14px;">
                    This link expires in 24 hours.<br>
                    If you didn't register, ignore this email.
                </p>
            </div>`
    });
}


// ─────────────────────────────────────────────
// Match notification email — sent to lost item owner
// when the AI finds a potential match
// ─────────────────────────────────────────────
async function sendMatchNotificationEmail(toEmail, name, lostItemTitle, confidenceScore, matchId) {
    // Link goes to the lost item's matches page, not a generic match page
    const matchUrl = `${FRONTEND_URL}/notifications`;

    await transporter.sendMail({
        from:    `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `Possible match found for your lost item: "${lostItemTitle}"`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="color:#15803d;">Good news, ${name}!</h2>
                <p>Our AI has found a potential match for your lost item:</p>
                <div style="background:#f0fdf4;border:1px solid #22c55e;padding:16px;
                            border-radius:8px;margin:16px 0;">
                    <strong style="font-size:1.1rem;">${lostItemTitle}</strong><br>
                    <span style="color:#16a34a;font-weight:bold;">
                        Match confidence: ${confidenceScore}%
                    </span>
                </div>
                <a href="${matchUrl}"
                   style="display:inline-block;padding:12px 24px;background:#22c55e;
                          color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
                    View Match on Dashboard
                </a>
                <p style="color:#666;font-size:14px;margin-top:16px;">
                    Log in to view the details, confirm if it's your item,
                    and start a chat with the finder.
                </p>
            </div>`
    });
}


// ─────────────────────────────────────────────
// Chat notification email — sent to finder
// when the lost item owner sends their first message
// ─────────────────────────────────────────────
async function sendChatNotificationEmail(toEmail, finderName, ownerName, itemTitle) {
    const chatUrl = `${FRONTEND_URL}/notifications`;

    await transporter.sendMail({
        from:    `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `${ownerName} has sent you a message about "${itemTitle}"`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="color:#15803d;">You have a new message, ${finderName}!</h2>
                <p>
                    <strong>${ownerName}</strong> believes you may have found their lost item
                    and has sent you a message:
                </p>
                <div style="background:#f0fdf4;border:1px solid #22c55e;padding:16px;
                            border-radius:8px;margin:16px 0;">
                    <strong>Item:</strong> ${itemTitle}
                </div>
                <a href="${chatUrl}"
                   style="display:inline-block;padding:12px 24px;background:#22c55e;
                          color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
                    Open Chat on Dashboard
                </a>
                <p style="color:#666;font-size:14px;margin-top:16px;">
                    Go to your dashboard, click the <strong>My Chats</strong> tab,
                    and reply to help reunite this item with its owner.
                </p>
            </div>`
    });
}


// ─────────────────────────────────────────────
// Password reset email
// ─────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, name, token) {
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
        from:    `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `Reset your ${APP_NAME} password`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="color:#15803d;">Password Reset Request</h2>
                <p>Hi ${name}, we received a request to reset your password.</p>
                <a href="${resetUrl}"
                   style="display:inline-block;padding:12px 24px;background:#dc2626;
                          color:white;text-decoration:none;border-radius:6px;margin:16px 0;font-weight:bold;">
                    Reset Password
                </a>
                <p style="color:#666;font-size:14px;">
                    This link expires in 1 hour.<br>
                    If you didn't request this, ignore this email. Your password won't change.
                </p>
            </div>`
    });
}


module.exports = {
    sendVerificationEmail,
    sendMatchNotificationEmail,
    sendChatNotificationEmail,    // NEW
    sendPasswordResetEmail
};
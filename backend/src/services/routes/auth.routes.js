// backend/src/routes/auth.routes.js

const express = require("express");
const router  = express.Router();

const {
    registerUser,
    verifyEmail,
    loginUser,
    forgotPassword,
    resetPassword,
    getMe,
} = require("../../controllers/auth.controller");

const { verifyToken } = require("../../middleware/auth.middleware");

const {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
} = require("../../middleware/rateLimit.middleware");

// Public routes
router.post("/register",        registerLimiter,       registerUser);
router.get( "/verify/:token",                          verifyEmail);
router.post("/login",           loginLimiter,          loginUser);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password",                         resetPassword);

// Protected
router.get("/me", verifyToken, getMe);

module.exports = router;
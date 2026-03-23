const express = require("express");
const router  = express.Router();
const auth    = require("../../controllers/auth.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.post("/register",        auth.registerUser);
router.get( "/verify/:token",   auth.verifyEmail);
router.post("/login",           auth.loginUser);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password",  auth.resetPassword);
router.get( "/me",              authMiddleware, auth.getMe);

module.exports = router;
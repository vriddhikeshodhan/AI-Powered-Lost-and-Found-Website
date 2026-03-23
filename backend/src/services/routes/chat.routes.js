const express  = require("express");
const router   = express.Router();
const chat     = require("../../controllers/chat.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.get("/active",          authMiddleware, chat.getActiveChats);
router.get("/:matchId",        authMiddleware, chat.getChatHistory);
router.get("/:matchId/unread", authMiddleware, chat.getUnreadCount);

module.exports = router;
const express  = require("express");
const router   = express.Router();
const chat     = require("../../controllers/chat.controller");
const { verifyToken } = require("../../middleware/auth.middleware");

router.get("/active",          verifyToken, chat.getActiveChats);
router.get("/:matchId",        verifyToken, chat.getChatHistory);
router.get("/:matchId/unread", verifyToken, chat.getUnreadCount);

module.exports = router;
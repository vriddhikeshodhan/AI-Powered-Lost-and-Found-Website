const express  = require("express");
const router   = express.Router();
const notif    = require("../../controllers/notification.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.get("/",             authMiddleware, notif.getNotifications);
router.get("/unread-count", authMiddleware, notif.getUnreadCount);
router.patch("/read-all",   authMiddleware, notif.markAllAsRead);
router.patch("/:id/read",   authMiddleware, notif.markAsRead);

module.exports = router;
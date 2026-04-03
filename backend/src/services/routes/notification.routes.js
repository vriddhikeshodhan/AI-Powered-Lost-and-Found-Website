const express  = require("express");
const router   = express.Router();
const notif    = require("../../controllers/notification.controller");
const { verifyToken } = require("../../middleware/auth.middleware");

router.get("/",             verifyToken, notif.getNotifications);
router.get("/unread-count", verifyToken, notif.getUnreadCount);
router.patch("/read-all",   verifyToken, notif.markAllAsRead);
router.patch("/:id/read",   verifyToken, notif.markAsRead);

module.exports = router;
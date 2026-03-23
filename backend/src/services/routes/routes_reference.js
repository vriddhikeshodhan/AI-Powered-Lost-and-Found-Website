// ═══════════════════════════════════════════════════
// auth.routes.js
// Save to: src/services/routes/auth.routes.js
// ═══════════════════════════════════════════════════
const express = require("express");
const router  = express.Router();
const auth    = require("../../controllers/auth.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.post("/register",       auth.registerUser);
router.get( "/verify/:token",  auth.verifyEmail);
router.post("/login",          auth.loginUser);
router.post("/forgot-password",auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.get( "/me",             authMiddleware, auth.getMe);

module.exports = router;


// ═══════════════════════════════════════════════════
// item.routes.js
// Save to: src/services/routes/item.routes.js
// ═══════════════════════════════════════════════════
// const express        = require("express");
// const router         = express.Router();
// const itemController = require("../controllers/item.controller");
// const authMiddleware = require("../middleware/auth.middleware");
// const upload         = require("../middleware/upload.middleware");
//
// // Public
// router.get("/categories", itemController.getCategories);
//
// // Protected
// router.post("/lost",  authMiddleware, upload.single("image"), itemController.reportLostItem);
// router.post("/found", authMiddleware, upload.single("image"), itemController.reportFoundItem);
// router.get("/my-items",              authMiddleware, itemController.getMyItems);
// router.get("/:itemId",               authMiddleware, itemController.getItemById);
// router.get("/:itemId/matches",       authMiddleware, itemController.getMatchesForItem);
// router.patch("/:itemId/resolve",     authMiddleware, itemController.resolveItem);
// router.patch("/:itemId/match/:matchId/feedback", authMiddleware, itemController.submitMatchFeedback);
// router.delete("/:itemId",            authMiddleware, itemController.deleteItem);
//
// module.exports = router;


// ═══════════════════════════════════════════════════
// match.routes.js  (stub — item routes handle most match logic)
// Save to: src/services/routes/match.routes.js
// ═══════════════════════════════════════════════════
// const express = require("express");
// const router  = express.Router();
// module.exports = router;


// ═══════════════════════════════════════════════════
// notification.routes.js
// Save to: src/services/routes/notification.routes.js
// ═══════════════════════════════════════════════════
// const express  = require("express");
// const router   = express.Router();
// const notif    = require("../controllers/notification.controller");
// const authMiddleware = require("../middleware/auth.middleware");
//
// router.get("/",            authMiddleware, notif.getNotifications);
// router.get("/unread-count",authMiddleware, notif.getUnreadCount);
// router.patch("/read-all",  authMiddleware, notif.markAllAsRead);
// router.patch("/:id/read",  authMiddleware, notif.markAsRead);
//
// module.exports = router;


// ═══════════════════════════════════════════════════
// chat.routes.js
// Save to: src/services/routes/chat.routes.js
// ═══════════════════════════════════════════════════
// const express  = require("express");
// const router   = express.Router();
// const chat     = require("../controllers/chat.controller");
// const authMiddleware = require("../middleware/auth.middleware");
//
// router.get("/active",           authMiddleware, chat.getActiveChats);
// router.get("/:matchId",         authMiddleware, chat.getChatHistory);
// router.get("/:matchId/unread",  authMiddleware, chat.getUnreadCount);
//
// module.exports = router;
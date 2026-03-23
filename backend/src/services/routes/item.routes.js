const express        = require("express");
const router         = express.Router();
const itemController = require("../../controllers/item.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const upload         = require("../../middleware/upload.middleware");

// Public — no auth needed
router.get("/categories", itemController.getCategories);

// Protected — require JWT
router.post("/lost",  authMiddleware, upload.single("image"), itemController.reportLostItem);
router.post("/found", authMiddleware, upload.single("image"), itemController.reportFoundItem);

router.get("/my-items", authMiddleware, itemController.getMyItems);
router.get("/:itemId",  authMiddleware, itemController.getItemById);

router.get(   "/:itemId/matches",                   authMiddleware, itemController.getMatchesForItem);
router.patch( "/:itemId/resolve",                   authMiddleware, itemController.resolveItem);
router.patch( "/:itemId/match/:matchId/feedback",   authMiddleware, itemController.submitMatchFeedback);
router.delete("/:itemId",                           authMiddleware, itemController.deleteItem);

module.exports = router;
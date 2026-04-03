const express = require("express");
const router  = express.Router();

const {
    reportFoundItem,
    reportLostItem,
    getMyItems,
    getItemById,
    getMatchesForItem,
    resolveItem,
    submitMatchFeedback,
    deleteItem,
    getCategories,
} = require("../../controllers/item.controller");

const { verifyToken }        = require("../../middleware/auth.middleware");
const upload       = require("../../middleware/upload.middleware");
const { itemSubmissionLimiter } = require("../../middleware/rateLimit.middleware");

// Public
router.get("/categories", getCategories);

router.post("/lost",
    verifyToken,
    itemSubmissionLimiter, 
    upload.single("image"),
    reportLostItem
);

router.post("/found",
    verifyToken,
    itemSubmissionLimiter,   
    upload.single("image"),
    reportFoundItem
);

router.get( "/my-items",                    verifyToken, getMyItems);
router.get( "/:itemId",                     verifyToken, getItemById);
router.get( "/:itemId/matches",             verifyToken, getMatchesForItem);
router.patch("/:itemId/resolve",            verifyToken, resolveItem);
router.patch("/:itemId/match/:matchId/feedback", verifyToken, submitMatchFeedback);
router.delete("/:itemId",                   verifyToken, deleteItem);

module.exports = router;
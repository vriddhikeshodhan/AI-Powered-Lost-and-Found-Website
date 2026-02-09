

const authMiddleware = require("../middleware/auth.middleware");
const express = require("express");
const router = express.Router();
const itemController = require("../controllers/item.controller");
//console.log("CONTROLLER CHECK:", itemController);
//console.log("REPORT FUNCTION:", itemController.reportLostItem); 

console.log("Item routes registered");

router.post("/lost", authMiddleware, itemController.reportLostItem);

router.post("/found", authMiddleware, itemController.reportFoundItem);

module.exports = router;
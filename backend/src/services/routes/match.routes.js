const express = require("express");
const router  = express.Router();

// Match logic lives in item.routes.js:
//   GET /api/items/:itemId/matches
//   PATCH /api/items/:itemId/resolve
//   PATCH /api/items/:itemId/match/:matchId/feedback
//
// This file is a placeholder to keep app.js clean.
// Add admin-level match routes here later if needed.

module.exports = router;
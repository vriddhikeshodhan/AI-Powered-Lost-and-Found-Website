const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const authRoutes         = require("./services/routes/auth.routes");
const itemRoutes         = require("./services/routes/item.routes");
const matchRoutes        = require("./services/routes/match.routes");
const notificationRoutes = require("./services/routes/notification.routes");
const chatRoutes         = require("./services/routes/chat.routes");

app.use("/api/auth",          authRoutes);
app.use("/api/items",         itemRoutes);
app.use("/api/matches",       matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat",          chatRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
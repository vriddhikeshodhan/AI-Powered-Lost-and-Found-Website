const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/uploads/*", (req, res) => {
    let filename = decodeURIComponent(req.params[0]); 
    filename = filename.replace(/\\/g, "/").replace(/%5C/gi, "/");
    filename = filename.replace(/uploads\//gi, "");
    filename = filename.replace(/^\/+/, "");
    filename = filename.trim(); 

    const pathWorkspaceRoot = path.join(__dirname, "../../uploads", filename);
    
    const pathBackendRoot = path.join(__dirname, "../uploads", filename);

    if (fs.existsSync(pathWorkspaceRoot)) {
        return res.sendFile(pathWorkspaceRoot);
    } else if (fs.existsSync(pathBackendRoot)) {
        return res.sendFile(pathBackendRoot);
    } else {
        console.error(`\n❌ [IMAGE 404] FAILED TO FIND IMAGE`);
        console.error(`Cleaned filename : "${filename}"`);
        console.error(`I looked here: "${pathWorkspaceRoot}"`);
        console.error(`-> Check your VS Code sidebar. Does this exact file exist?\n`);
        
        return res.status(404).send("Image not found");
    }
});

const authRoutes         = require("./services/routes/auth.routes");
const itemRoutes         = require("./services/routes/item.routes");
const matchRoutes        = require("./services/routes/match.routes");
const notificationRoutes = require("./services/routes/notification.routes");
const chatRoutes         = require("./services/routes/chat.routes");
const adminRoutes        = require('./services/routes/admin.routes');

app.use("/api/auth",          authRoutes);
app.use("/api/items",         itemRoutes);
app.use("/api/matches",       matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat",          chatRoutes);
app.use('/api/admin',         adminRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
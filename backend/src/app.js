const express = require("express");
const cors = require("cors");
console.log("APP.JS LOADED");
const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/item.routes");
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

module.exports = app;

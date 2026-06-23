const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const adminRoutes = require("./routes/admin");
const configRoutes = require("./routes/config");
const blockDuringMaintenance = require("./middleware/maintenance");
const { optionalAuth } = require("./middleware/auth");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(optionalAuth);
app.use(express.static(path.join(__dirname, "..", "public"), { index: false }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/config", configRoutes);
app.use("/api/recipes", blockDuringMaintenance, recipeRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "family-cookbook" });
});

// Apply maintenance middleware before the catch-all route
app.use(blockDuringMaintenance);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = app;

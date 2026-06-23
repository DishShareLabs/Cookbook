const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const adminRoutes = require("./routes/admin");
const configRoutes = require("./routes/config");
const blockDuringMaintenance = require("./middleware/maintenance");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Apply maintenance middleware only to these routes (not admin)
app.use("/api/config", blockDuringMaintenance, configRoutes);
app.use("/api/recipes", blockDuringMaintenance, recipeRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "family-cookbook" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = app;

const express = require("express");

const Setting = require("../models/Setting");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuth, async (req, res) => {
  try {
    const settings = await Setting.getSiteSettings();

    res.json({
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      isAdmin: req.user?.role === "admin"
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load site settings." });
  }
});

module.exports = router;

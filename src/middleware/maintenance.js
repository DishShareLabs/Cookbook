const path = require("path");
const Setting = require("../models/Setting");

async function blockDuringMaintenance(req, res, next) {
  try {
    if (req.user?.role === "admin") {
      return next();
    }

    const settings = await Setting.getSiteSettings();

    if (settings.maintenanceMode) {
      // For API requests, return JSON
      if (req.path.startsWith("/api/")) {
        return res.status(503).json({
          message: settings.maintenanceMessage || "Dishshare is down for maintenance currently."
        });
      }
      
      // For other requests, serve the maintenance page
      return res.status(503).sendFile(path.join(__dirname, "..", "..", "public", "maintenance.html"));
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = blockDuringMaintenance;

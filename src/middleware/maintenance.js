const path = require("path");
const Setting = require("../models/Setting");

function isMaintenanceEnabled(settings) {
  if (typeof settings.maintenanceMode === "boolean") {
    return settings.maintenanceMode;
  }
  return typeof settings.maintenceMode === "boolean" ? settings.maintenceMode : false;
}

async function blockDuringMaintenance(req, res, next) {
  try {
    if (req.user?.role === "admin") {
      return next();
    }

    const settings = await Setting.getSiteSettings();
    const maintenanceEnabled = isMaintenanceEnabled(settings);

    if (maintenanceEnabled) {
      const accept = (req.headers.accept || "").toLowerCase();
      const isHtmlRequest = accept.includes("text/html");
      const isApiRequest = req.path.startsWith("/api/") || accept.includes("application/json");

      if (isHtmlRequest) {
        return res.status(503).sendFile(path.join(__dirname, "..", "..", "public", "maintenance.html"));
      }

      if (isApiRequest) {
        return res.status(503).json({
          message: settings.maintenanceMessage || "Dishshare is down for maintenance currently."
        });
      }

      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = blockDuringMaintenance;

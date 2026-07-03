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
      const requestPath = (req.originalUrl || req.url || req.path).split("?")[0];
      const ext = path.extname(requestPath).toLowerCase();
      const accept = (req.headers.accept || "").toLowerCase();
      const isApiRequest = requestPath.startsWith("/api/") || accept.includes("application/json");
      const isStaticAsset = ext && ext !== ".html";

      // Don't redirect if already on maintenance page
      if (requestPath === "/maintenance") {
        return next();
      }

      if (isStaticAsset) {
        return next();
      }

      if (isApiRequest) {
        return res.status(503).json({
          message: settings.maintenanceMessage || "Dishshare is down for maintenance currently."
        });
      }

      // Redirect to maintenance page instead of using sendFile for Vercel compatibility
      return res.status(503).redirect("/maintenance");
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = blockDuringMaintenance;

const Setting = require("../models/Setting");

async function blockDuringMaintenance(req, res, next) {
  try {
    if (req.user?.role === "admin") {
      return next();
    }

    const settings = await Setting.getSiteSettings();

    if (settings.maintenanceMode) {
      return res.status(503).json({
        message: settings.maintenanceMessage || "Dishshare is down for maintenance currently."
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = blockDuringMaintenance;

const Setting = require("../models/Setting");

async function blockDuringMaintenance(req, res, next) {
  try {
    if (req.user?.role === "admin") {
      return next();
    }

    const settings = await Setting.getSiteSettings();

    if (settings.maintenanceMode) {
      return res.status(503).json({
        message: settings.maintenanceMessage || "Cook Boo is temporarily in maintenance mode."
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = blockDuringMaintenance;

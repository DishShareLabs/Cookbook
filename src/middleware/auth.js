const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Please log in first." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("_id name email role status");

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Your session is no longer valid." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Your session expired. Please log in again." });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("_id name email role status");

    if (user?.status === "active") {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access is required." });
  }

  next();
}

module.exports = requireAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.requireAdmin = requireAdmin;

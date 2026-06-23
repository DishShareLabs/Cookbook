const express = require("express");

const Recipe = require("../models/Recipe");
const Setting = require("../models/Setting");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  };
}

router.get("/summary", async (req, res) => {
  try {
    const [recipeCount, memberCount, draftCount, archivedCount, tags, settings] = await Promise.all([
      Recipe.countDocuments({ status: "published" }),
      User.countDocuments({ status: "active" }),
      Recipe.countDocuments({ status: "draft" }),
      Recipe.countDocuments({ status: "archived" }),
      Recipe.distinct("tags"),
      Setting.getSiteSettings()
    ]);

    const newestRecipes = await Recipe.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      stats: {
        recipeCount,
        memberCount,
        draftCount,
        archivedCount,
        tagCount: tags.length
      },
      settings: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage
      },
      newestRecipes
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load admin summary." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users: users.map(publicUser) });
  } catch (error) {
    res.status(500).json({ message: "Could not load users." });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const updates = {};

    if (["member", "admin"].includes(req.body.role)) {
      updates.role = req.body.role;
    }

    if (["active", "disabled"].includes(req.body.status)) {
      updates.status = req.body.status;
    }

    if (String(req.params.id) === String(req.user._id) && updates.status === "disabled") {
      return res.status(400).json({ message: "You cannot disable your own account." });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Could not update user." });
  }
});

router.patch("/maintenance", async (req, res) => {
  try {
    const settings = await Setting.getSiteSettings();

    if (typeof req.body.maintenanceMode === "boolean") {
      settings.maintenanceMode = req.body.maintenanceMode;
      settings.maintenceMode = req.body.maintenanceMode;
    }

    if (typeof req.body.maintenanceMessage === "string") {
      settings.maintenanceMessage = req.body.maintenanceMessage.trim() || settings.maintenanceMessage;
    }

    await settings.save();

    res.json({
      settings: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not update maintenance mode." });
  }
});

router.patch("/recipes/:id/status", async (req, res) => {
  try {
    if (!["published", "draft", "archived"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid recipe status." });
    }

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate("createdBy", "name");

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.json({ recipe });
  } catch (error) {
    res.status(500).json({ message: "Could not update recipe status." });
  }
});

router.delete("/recipes/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Could not delete recipe." });
  }
});

module.exports = router;

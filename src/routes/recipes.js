const express = require("express");
const mongoose = require("mongoose");

const Recipe = require("../models/Recipe");
const requireAuth = require("../middleware/auth");
const { optionalAuth } = require("../middleware/auth");
const blockDuringMaintenance = require("../middleware/maintenance");

const router = express.Router();

function splitLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item.text || item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function canManageRecipe(user, recipe) {
  return user?.role === "admin" || String(recipe.createdBy?._id || recipe.createdBy) === String(user?._id);
}

function recipePayload(body, userId) {
  const title = String(body.title || "").trim();
  const ingredients = splitLines(body.ingredients).map((text) => ({ text }));
  const steps = splitLines(body.steps).map((text) => ({ text }));
  const tags = splitTags(body.tags);
  const status = ["published", "draft"].includes(body.status) ? body.status : "published";

  return {
    title,
    description: String(body.description || "").trim(),
    ingredients,
    steps,
    tags,
    mealType: [
      "breakfast",
      "lunch",
      "dinner",
      "dessert",
      "snack",
      "drink",
      "side",
      "other"
    ].includes(body.mealType)
      ? body.mealType
      : "other",
    difficulty: ["easy", "medium", "special"].includes(body.difficulty)
      ? body.difficulty
      : "easy",
    prepMinutes: toNumber(body.prepMinutes, 0),
    cookMinutes: toNumber(body.cookMinutes, 0),
    servings: Math.max(1, toNumber(body.servings, 4)),
    imageUrl: String(body.imageUrl || "").trim(),
    familyStory: String(body.familyStory || "").trim(),
    sourceName: String(body.sourceName || "").trim(),
    status,
    createdBy: userId
  };
}

function serializeRecipe(recipe, user) {
  const item = recipe.toObject ? recipe.toObject() : recipe;
  const favorites = item.favorites || [];
  const userId = String(user?._id || "");

  return {
    ...item,
    favoriteCount: favorites.length,
    isFavorite: Boolean(userId && favorites.some((id) => String(id) === userId)),
    canEdit: canManageRecipe(user, item)
  };
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { q, tag, mealType, difficulty, mine, favorites, status, sort } = req.query;
    const query = { status: "published" };
    const user = req.user;

    if (user?.role === "admin" && status && status !== "all") {
      query.status = status;
    } else if (user?.role === "admin" && status === "all") {
      delete query.status;
    }

    if (mine === "true" && user) {
      query.createdBy = user._id;
      delete query.status;
      if (status && status !== "all") query.status = status;
    }

    if (favorites === "true" && user) {
      query.favorites = user._id;
    }

    if (q) {
      query.$text = { $search: q };
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (mealType && mealType !== "all") {
      query.mealType = mealType;
    }

    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      title: { title: 1 },
      popular: { favorites: -1, createdAt: -1 }
    };

    const recipes = await Recipe.find(query)
      .populate("createdBy", "name")
      .sort(q ? { score: { $meta: "textScore" }, createdAt: -1 } : sortMap[sort] || sortMap.newest)
      .limit(80);

    const tags = await Recipe.distinct("tags");

    res.json({
      recipes: recipes.map((recipe) => serializeRecipe(recipe, user)),
      tags: tags.sort((a, b) => a.localeCompare(b))
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load recipes." });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const recipe = await Recipe.findById(req.params.id).populate("createdBy", "name");
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    if (recipe.status !== "published" && !canManageRecipe(req.user, recipe)) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.json({ recipe: serializeRecipe(recipe, req.user) });
  } catch (error) {
    res.status(500).json({ message: "Could not load recipe." });
  }
});

router.post("/", requireAuth, blockDuringMaintenance, async (req, res) => {
  try {
    const payload = recipePayload(req.body, req.user._id);

    if (!payload.title || payload.ingredients.length === 0 || payload.steps.length === 0) {
      return res.status(400).json({
        message: "Title, ingredients, and cooking steps are required."
      });
    }

    const recipe = await Recipe.create(payload);

    await recipe.populate("createdBy", "name");
    res.status(201).json({ recipe: serializeRecipe(recipe, req.user) });
  } catch (error) {
    res.status(500).json({ message: "Could not save the recipe." });
  }
});

router.put("/:id", requireAuth, blockDuringMaintenance, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    if (!canManageRecipe(req.user, recipe)) {
      return res.status(403).json({ message: "You can only edit your own recipes." });
    }

    const payload = recipePayload(req.body, recipe.createdBy);
    delete payload.createdBy;

    if (!payload.title || payload.ingredients.length === 0 || payload.steps.length === 0) {
      return res.status(400).json({
        message: "Title, ingredients, and cooking steps are required."
      });
    }

    Object.assign(recipe, payload);
    await recipe.save();
    await recipe.populate("createdBy", "name");

    res.json({ recipe: serializeRecipe(recipe, req.user) });
  } catch (error) {
    res.status(500).json({ message: "Could not update the recipe." });
  }
});

router.delete("/:id", requireAuth, blockDuringMaintenance, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    if (!canManageRecipe(req.user, recipe)) {
      return res.status(403).json({ message: "You can only delete your own recipes." });
    }

    await recipe.deleteOne();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Could not delete the recipe." });
  }
});

router.post("/:id/favorite", requireAuth, blockDuringMaintenance, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const isFavorite = recipe.favorites.some((id) => String(id) === String(req.user._id));
    const update = isFavorite
      ? { $pull: { favorites: req.user._id } }
      : { $addToSet: { favorites: req.user._id } };

    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, update, {
      new: true
    }).populate("createdBy", "name");

    res.json({ recipe: serializeRecipe(updatedRecipe, req.user) });
  } catch (error) {
    res.status(500).json({ message: "Could not update favorite." });
  }
});

module.exports = router;

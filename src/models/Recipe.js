const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    description: {
      type: String,
      trim: true,
      maxlength: 360,
      default: ""
    },
    ingredients: {
      type: [ingredientSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one ingredient is required."
      }
    },
    steps: {
      type: [stepSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one cooking step is required."
      }
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "dessert", "snack", "drink", "side", "other"],
      default: "other"
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "special"],
      default: "easy"
    },
    prepMinutes: {
      type: Number,
      min: 0,
      default: 0
    },
    cookMinutes: {
      type: Number,
      min: 0,
      default: 0
    },
    servings: {
      type: Number,
      min: 1,
      default: 4
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    familyStory: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: ""
    },
    sourceName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published"
    },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

recipeSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  "ingredients.text": "text",
  familyStory: "text",
  sourceName: "text"
});

module.exports = mongoose.model("Recipe", recipeSchema);

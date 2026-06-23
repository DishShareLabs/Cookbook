const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "Cook Boo is getting a quick polish. Please check back soon."
    }
  },
  { timestamps: true }
);

settingSchema.statics.getSiteSettings = function getSiteSettings() {
  return this.findOneAndUpdate(
    { key: "site" },
    { $setOnInsert: { key: "site" } },
    { new: true, upsert: true }
  );
};

module.exports = mongoose.model("Setting", settingSchema);

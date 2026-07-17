const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Section", sectionSchema);
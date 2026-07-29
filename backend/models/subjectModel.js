const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
    },

    subjectCode: {
      type: String, 
      trim: true,
      uppercase: true,
      default: "",
    },

     subjectType: {
      type: String, 
      trim: true,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subject", subjectSchema);
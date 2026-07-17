const mongoose = require("mongoose");

const academicYearSchema = new mongoose.Schema(
  {
    name: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    isCurrent: {
      type: Boolean,
      default: false, 
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }  
);

module.exports = mongoose.model("AcademicYear", academicYearSchema);
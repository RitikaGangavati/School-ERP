const mongoose = require("mongoose");

const subjectWeeklyPeriodSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    periodsPerWeek: {
      type: Number,
      required: true,
      min: 1,
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

// One subject can have only one weekly-period setting
// for a particular academic year + class + section.
subjectWeeklyPeriodSchema.index(
  {
    academicYear: 1,
    class: 1,
    section: 1,
    subject: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "SubjectWeeklyPeriod",
  subjectWeeklyPeriodSchema
);
const mongoose = require("mongoose");

const subjectTeacherSchema = new mongoose.Schema(
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

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// One teacher per subject per section per year — no ambiguity, no duplicates
subjectTeacherSchema.index(
  { academicYear: 1, class: 1, section: 1, subject: 1 },
  { unique: true },
);

module.exports = mongoose.model("SubjectTeacher", subjectTeacherSchema);
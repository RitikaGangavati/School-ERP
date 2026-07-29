const mongoose = require("mongoose");

const subjectGroupSchema = new mongoose.Schema(
  {
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicYear",
        required: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    description: {
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

// A group name should be unique within the same class (not globally),
// since different classes might reuse a name like "Science Group"
subjectGroupSchema.index({ groupName: 1, class: 1 }, { unique: true });

module.exports = mongoose.model("SubjectGroup", subjectGroupSchema);
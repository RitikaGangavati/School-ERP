const mongoose = require("mongoose");

const studentPromotionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },

    fromAcademicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    fromClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    fromSection: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },

    toAcademicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    toClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    toSection: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },

    promotedOn: { type: Date, default: Date.now },
    promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentPromotion", studentPromotionSchema);7
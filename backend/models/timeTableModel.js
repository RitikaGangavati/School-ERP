const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    roomNo: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

timetableSchema.index(
  { academicYear: 1, class: 1, section: 1, day: 1, timeSlot: 1 },
  { unique: true },
);
timetableSchema.index(
  { academicYear: 1, teacher: 1, day: 1, timeSlot: 1 },
  { unique: true },
);

module.exports = mongoose.model("Timetable", timetableSchema);
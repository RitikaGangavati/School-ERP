const mongoose = require("mongoose");

const personalSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    birthPlace: { type: String, trim: true, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    mobile: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    aadhaarNo: { type: String, trim: true, default: "" },
    religion: { type: String, trim: true, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    casteName: { type: String, trim: true, default: "" },
    motherTongue: { type: String, trim: true, default: "" },
    photo: { type: String, default: "" },
  },
  { _id: false },
);

const academicSchema = new mongoose.Schema(
  {
    admissionNumber: { type: String, required: true, trim: true },
    admissionDate: { type: Date, default: Date.now },
    admissionType: {
      type: String,
      enum: ["New Admission", "Transfer", "Readmission"],
      default: "New Admission",
    },
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
    rollNo: { type: String, trim: true, default: "" },
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Transferred", "Graduated"],
      default: "Active",
    },
  },
  { _id: false },
);

const healthSchema = new mongoose.Schema(
  {
    bloodGroup: { type: String, trim: true, default: "" },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    allergies: {
      type: String,
      default: "",
    },

    disability: {
      type: String,
      default: "",
    },
    medicalHistory: { type: String, trim: true, default: "" },
  },
  { _id: false },
);
// Parent / Guardian sub-schema
const parentSchema = new mongoose.Schema(
  {
    fatherName: { type: String, trim: true, default: "" },
    fatherPhone: { type: String, trim: true, default: "" },
    fatherOccupation: { type: String, trim: true, default: "" },
    fatherPhoto: { type: String, default: "" },
    motherName: { type: String, trim: true, default: "" },
    motherPhone: { type: String, trim: true, default: "" },
    motherOccupation: { type: String, trim: true, default: "" },
    motherPhoto: { type: String, default: "" },
    annualIncome: {
      type: Number,
      default: null,
    },
    guardianIs: {
      type: String,
      enum: ["Father", "Mother", "Other"],
      default: "Father",
    },
    guardianName: { type: String, trim: true, default: "" },
    guardianRelation: { type: String, trim: true, default: "" },
    guardianPhone: { type: String, trim: true, default: "" },
    guardianOccupation: { type: String, trim: true, default: "" },
    guardianEmail: { type: String, trim: true, lowercase: true, default: "" },
    guardianPhoto: { type: String, default: "" },
    guardianAddress: { type: String, trim: true, default: "" },
  },
  { _id: false },
);
const addressSchema = new mongoose.Schema(
  {
    sameAsGuardian: { type: Boolean, default: false }, // "If Guardian Address Is Current Address"
    currentAddress: { type: String, trim: true, default: "" },

    sameAsCurrent: { type: Boolean, default: false }, // "If Permanent Address Is Current Address"
    permanentAddress: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const studentSchema = new mongoose.Schema(
  {
    personal: { type: personalSchema, required: true },
    academic: { type: academicSchema, required: true },
    health: { type: healthSchema, default: () => ({}) },
    parent: { type: parentSchema, default: () => ({}) },
    address: { type: addressSchema, default: () => ({}) },
    documents: [
      {
        name: String,
        file: String,
      },
    ],

    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// admissionNumber must be unique — since it's nested, enforce via a separate index
studentSchema.index({ "academic.admissionNumber": 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);

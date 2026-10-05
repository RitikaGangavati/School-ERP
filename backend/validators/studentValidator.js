const { z } = require("zod");
const { objectId } = require("./commonValidator");

const personalSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, "Last name is required"),
  dob: z.coerce.date({ error: "Date of birth is required" }),
  birthPlace: z.string().trim().optional(),
  gender: z.enum(["Male", "Female", "Other"]),
  mobile: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("Invalid email address").optional().or(z.literal("")),
  aadhaarNo: z.string().trim().optional(),
  religion: z.string().trim().optional(),
  category: objectId.optional().nullable(),
  casteName: z.string().trim().optional(),
  motherTongue: z.string().trim().optional(),
  photo: z.string().trim().optional(),
});

const academicSchema = z.object({
  admissionNumber: z.string().trim().min(1, "Admission number is required"),
  admissionDate: z.coerce.date().optional(),
  admissionType: z.enum(["New Admission", "Transfer", "Readmission"]).optional(),
  academicYear: objectId,
  class: objectId,
  section: objectId,
  rollNo: z.string().trim().optional(),
  house: objectId.optional().nullable(),
  status: z.enum(["Active", "Inactive", "Transferred", "Graduated"]).optional(),
});

const healthSchema = z.object({
  bloodGroup: z.string().trim().optional(),
  height: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  allergies: z.string().trim().optional(),
  disability: z.string().trim().optional(),
  medicalHistory: z.string().trim().optional(),
});

const parentSchema = z.object({
  fatherName: z.string().trim().optional(),
  fatherPhone: z.string().trim().optional(),
  fatherOccupation: z.string().trim().optional(),
  fatherPhoto: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  motherPhone: z.string().trim().optional(),
  motherOccupation: z.string().trim().optional(),
  motherPhoto: z.string().trim().optional(),
  annualIncome: z.number().optional().nullable(),
  guardianIs: z.enum(["Father", "Mother", "Other"]).optional(),
  guardianName: z.string().trim().optional(),
  guardianRelation: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
  guardianOccupation: z.string().trim().optional(),
  guardianEmail: z.string().trim().toLowerCase().email("Invalid email address").optional().or(z.literal("")),
  guardianPhoto: z.string().trim().optional(),
  guardianAddress: z.string().trim().optional(),
});

const addressSchema = z.object({
  sameAsGuardian: z.boolean().optional(),
  currentAddress: z.string().trim().optional(),
  sameAsCurrent: z.boolean().optional(),
  permanentAddress: z.string().trim().optional(),
});

const documentSchema = z.object({
  name: z.string().trim().optional(),
  file: z.string().trim().optional(),
});

const createStudentSchema = z.object({
  personal: personalSchema,
  academic: academicSchema,
  health: healthSchema.optional(),
  parent: parentSchema.optional(),
  address: addressSchema.optional(),
  documents: z.array(documentSchema).optional(),
  active: z.boolean().optional(),
});

const updateStudentSchema = z
  .object({
    personal: personalSchema.partial().optional(),
    academic: academicSchema.partial().optional(),
    health: healthSchema.optional(),
    parent: parentSchema.optional(),
    address: addressSchema.optional(),
    documents: z.array(documentSchema).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

const studentListQuerySchema = z.object({
  search: z.string().trim().optional(),
  academicYear: objectId.optional(),
  class: objectId.optional(),
  section: objectId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  idParamSchema,
  studentListQuerySchema,
};
const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createTeacherSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dob: z.coerce.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female", "Other"]),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  photo: z.string().trim().optional(),
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  joiningDate: z.coerce.date().optional(),
  designation: z.string().trim().optional(),
  department: z.string().trim().optional(),
  subjects: z.array(objectId).optional(),
  qualification: z.string().trim().optional(),
  experience: z.number().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  active: z.boolean().optional(),
});

const updateTeacherSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
    dob: z.coerce.date().optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    mobile: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits").optional(),
    photo: z.string().trim().optional(),
    employeeId: z.string().trim().min(1).optional(),
    joiningDate: z.coerce.date().optional(),
    designation: z.string().trim().optional(),
    department: z.string().trim().optional(),
    subjects: z.array(objectId).optional(),
    qualification: z.string().trim().optional(),
    experience: z.number().optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createTeacherSchema,
  updateTeacherSchema,
  idParamSchema,
};
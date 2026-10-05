const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  role: objectId,
  active: z.boolean().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .optional(),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits")
    .optional(),
  role: objectId.optional(),
  active: z.boolean().optional(),
})
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });


const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
};

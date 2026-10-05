const { z } = require("zod");
const { objectId } = require("./commonValidator");

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  // no min-length here: don't reveal the password policy to attackers
  password: z.string().min(1, "Password is required").max(128, "Password too long"),
});

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  role: objectId,
});

module.exports = { loginSchema, registerSchema };
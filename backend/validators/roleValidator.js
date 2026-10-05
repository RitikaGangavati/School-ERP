const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createRoleSchema = z.object({
  roleName: z.string().trim().min(1, "Role name is required"),
  description: z.string().trim().optional(),
  active: z.boolean().optional(),
});

const updateRoleSchema = z
  .object({
    roleName: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  idParamSchema,
};
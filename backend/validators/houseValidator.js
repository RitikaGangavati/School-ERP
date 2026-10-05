const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createHouseSchema = z.object({
  houseName: z.string().trim().min(1, "House name is required"),
  description: z.string().trim().optional(),
  active: z.boolean().optional(),
});

const updateHouseSchema = z
  .object({
    houseName: z.string().trim().min(1).optional(),
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
  createHouseSchema,
  updateHouseSchema,
  idParamSchema,
};
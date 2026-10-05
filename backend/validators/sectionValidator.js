const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createSectionSchema = z.object({
  sectionName: z.string().trim().min(1, "Section name is required"),
  active: z.boolean().optional(),
});

const updateSectionSchema = z
  .object({
    sectionName: z.string().trim().min(1).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createSectionSchema,
  updateSectionSchema,
  idParamSchema,
};
const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createCategorySchema = z.object({
  categoryName: z.string().trim().min(1, "Category name is required"),
  categoryCode: z.string().trim().toUpperCase().optional(),
  description: z.string().trim().optional(),
  active: z.boolean().optional(),
});

const updateCategorySchema = z
  .object({
    categoryName: z.string().trim().min(1).optional(),
    categoryCode: z.string().trim().toUpperCase().optional(),
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
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
};
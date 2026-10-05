const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createClassSchema = z.object({
  className: z.string().trim().min(1, "Class name is required"),
  sections: z.array(objectId).optional(),
  active: z.boolean().optional(),
});

const updateClassSchema = z
  .object({
    className: z.string().trim().min(1).optional(),
    sections: z.array(objectId).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createClassSchema,
  updateClassSchema,
  idParamSchema,
};
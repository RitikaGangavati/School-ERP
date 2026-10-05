const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createSubjectSchema = z.object({
  subjectName: z.string().trim().min(1, "Subject name is required"),
  subjectCode: z.string().trim().toUpperCase().optional(),
  subjectType: z.string().trim().optional(),
  active: z.boolean().optional(),
});

const updateSubjectSchema = z
  .object({
    subjectName: z.string().trim().min(1).optional(),
    subjectCode: z.string().trim().toUpperCase().optional(),
    subjectType: z.string().trim().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createSubjectSchema,
  updateSubjectSchema,
  idParamSchema,
};
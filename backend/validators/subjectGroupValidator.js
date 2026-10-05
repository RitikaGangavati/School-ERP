const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createSubjectGroupSchema = z.object({
  academicYear: objectId,
  groupName: z.string().trim().min(1, "Group name is required"),
  class: objectId,
  sections: z.array(objectId).optional(),
  subjects: z.array(objectId).min(1, "Select at least one subject"),
  description: z.string().trim().optional(),
  active: z.boolean().optional(),
});

const updateSubjectGroupSchema = z
  .object({
    academicYear: objectId.optional(),
    groupName: z.string().trim().min(1).optional(),
    class: objectId.optional(),
    sections: z.array(objectId).optional(),
    subjects: z.array(objectId).min(1, "Select at least one subject").optional(),
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
  createSubjectGroupSchema,
  updateSubjectGroupSchema,
  idParamSchema,
};
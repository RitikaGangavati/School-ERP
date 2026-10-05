const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createClassTeacherSchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
  teacher: objectId,
  active: z.boolean().optional(),
});

const updateClassTeacherSchema = z
  .object({
    academicYear: objectId.optional(),
    class: objectId.optional(),
    section: objectId.optional(),
    teacher: objectId.optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createClassTeacherSchema,
  updateClassTeacherSchema,
  idParamSchema,
};
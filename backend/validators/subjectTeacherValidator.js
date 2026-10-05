const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createSubjectTeacherSchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
  subject: objectId,
  teacher: objectId,
});

const updateSubjectTeacherSchema = z
  .object({
    academicYear: objectId.optional(),
    class: objectId.optional(),
    section: objectId.optional(),
    subject: objectId.optional(),
    teacher: objectId.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createSubjectTeacherSchema,
  updateSubjectTeacherSchema,
  idParamSchema,
};
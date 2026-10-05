const { z } = require("zod");
const { objectId } = require("./commonValidator");

const getStudentsForPromotionSchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
});

const promoteStudentsSchema = z.object({
  studentIds: z.array(objectId).min(1, "No students selected"),
  fromAcademicYear: objectId,
  fromClass: objectId,
  fromSection: objectId,
  promoteToAcademicYear: objectId,
  promoteToClass: objectId,
  promoteToSection: objectId,
});

const studentIdParamSchema = z.object({
  studentId: objectId,
});

module.exports = {
  getStudentsForPromotionSchema,
  promoteStudentsSchema,
  studentIdParamSchema,
};

const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createSubjectWeeklyPeriodSchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
  subject: objectId,
  periodsPerWeek: z.coerce
    .number({ error: "Periods per week is required" })
    .int("Periods per week must be a whole number")
    .min(1, "Periods per week must be greater than 0"),
});

const updateSubjectWeeklyPeriodSchema = z
  .object({
    academicYear: objectId.optional(),
    class: objectId.optional(),
    section: objectId.optional(),
    subject: objectId.optional(),
    periodsPerWeek: z.coerce
      .number()
      .int("Periods per week must be a whole number")
      .min(1, "Periods per week must be greater than 0")
      .optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const bySectionQuerySchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
});

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createSubjectWeeklyPeriodSchema,
  updateSubjectWeeklyPeriodSchema,
  bySectionQuerySchema,
  idParamSchema,
};
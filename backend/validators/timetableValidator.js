const { z } = require("zod");
const { objectId } = require("./commonValidator");

const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const createTimetableSchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
  day: z.enum(validDays, { error: "Invalid timetable day" }),
  timeSlot: objectId,
  subject: objectId,
  teacher: objectId,
  roomNo: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
});

const updateTimetableSchema = z
  .object({
    academicYear: objectId.optional(),
    class: objectId.optional(),
    section: objectId.optional(),
    day: z.enum(validDays, { error: "Invalid timetable day" }).optional(),
    timeSlot: objectId.optional(),
    subject: objectId.optional(),
    teacher: objectId.optional(),
    roomNo: z.string().trim().optional(),
    remarks: z.string().trim().optional(),
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

const byTeacherQuerySchema = z.object({
  academicYear: objectId,
  teacher: objectId,
});

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createTimetableSchema,
  updateTimetableSchema,
  bySectionQuerySchema,
  byTeacherQuerySchema,
  idParamSchema,
};
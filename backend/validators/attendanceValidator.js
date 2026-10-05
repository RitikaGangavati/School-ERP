const { z } = require("zod");
const { objectId } = require("./commonValidator");

// Plain calendar date "YYYY-MM-DD" (no time, no timezone), and must be a real date
const dateString = z
  .string({ error: "Date is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((s) => new Date(`${s}T00:00:00.000Z`).toISOString().slice(0, 10) === s, {
    message: "Invalid date",
  });

const getAttendanceForDateSchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
  date: dateString,
});

const attendanceStatusEnum = ["Present", "Absent", "Late", "Half Day", "Leave"];

const recordSchema = z.object({
  student: objectId,
  status: z.enum(attendanceStatusEnum),
  remarks: z.string().trim().optional(),
});

const saveAttendanceSchema = z.object({
  academicYear: objectId,
  class: objectId,
  section: objectId,
  date: dateString,
  records: z.array(recordSchema).min(1, "No attendance records to save"),
});

const studentIdParamSchema = z.object({
  studentId: objectId,
});

const studentAttendanceQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
});

module.exports = {
  getAttendanceForDateSchema,
  saveAttendanceSchema,
  studentIdParamSchema,
  studentAttendanceQuerySchema,
};
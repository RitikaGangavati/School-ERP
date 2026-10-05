const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createAcademicYearSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    startDate: z.coerce.date({ required_error: "Start date is required" }),
    endDate: z.coerce.date({ required_error: "End date is required" }),
    isCurrent: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: "Start date must be before end date",
    path: ["startDate"],
  });

const updateAcademicYearSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isCurrent: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.startDate < data.endDate,
    {
      message: "Start date must be before end date",
      path: ["startDate"],
    }
  );

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  idParamSchema,
};
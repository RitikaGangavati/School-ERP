const { z } = require("zod");
const { objectId } = require("./commonValidator");

const createTimeSlotSchema = z.object({
  periodName: z.string().trim().min(1, "Period name is required"),
  startTime: z.string().trim().min(1, "Start time is required"),
  endTime: z.string().trim().min(1, "End time is required"),
  type: z.enum(["Period", "Break", "Lunch"]).optional(),
  displayOrder: z.number({ required_error: "Display order is required" }),
  active: z.boolean().optional(),
});

const updateTimeSlotSchema = z
  .object({
    periodName: z.string().trim().min(1).optional(),
    startTime: z.string().trim().min(1).optional(),
    endTime: z.string().trim().min(1).optional(),
    type: z.enum(["Period", "Break", "Lunch"]).optional(),
    displayOrder: z.number().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  createTimeSlotSchema,
  updateTimeSlotSchema,
  idParamSchema,
};
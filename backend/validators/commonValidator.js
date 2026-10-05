const mongoose = require("mongoose");
const { z } = require("zod");

const objectId = z
  .string({ error: "This field is required" })
  .refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid ID format" }
  );

module.exports = {
  objectId,
};
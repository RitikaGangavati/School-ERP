const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
    },

    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Class", classSchema);
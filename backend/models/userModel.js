const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
     // Hashed refresh tokens, one per logged-in device (max 5)
    refreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          _id: false,
        },
      ],
      default: [],
      select: false, // never returned in normal queries
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("User", userSchema);

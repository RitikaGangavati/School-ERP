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
    },

    profile: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: [
        "Super Admin",
        "Admin",
        "Teacher",
        "Student",
        "Parent",
        "Accountant",
        "Librarian",
        "Receptionist",
      ],
      default: "Super Admin",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);

});

module.exports = mongoose.model("User", userSchema);

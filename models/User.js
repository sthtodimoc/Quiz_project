const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
      required: true,
    },
    roleRequest: {
      requestedRole: {
        type: String,
        enum: ["teacher", "admin"],
      },
      status: {
        type: String,
        enum: ["pending", "approved", "denied"],
      },
      requestedAt: Date,
      reviewedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

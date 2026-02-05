const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correct: {
    type: Number,
    required: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    questions: [questionSchema],

    // ⏱ QUIZ METADATA
    timeLimit: {
      type: Number, // minutes
      required: true,
      default: 10,
      min: 1,
    },

    maxAttempts: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    published: {
      type: Boolean,
      default: false,
      index: true, // 🔹 fast student filtering
    },

    // 👨‍🏫 Owner (admin / teacher)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // 🔹 fast teacher dashboards
    },
  },
  {
    timestamps: true,
  }
);

// 🔹 Useful compound index for dashboards
quizSchema.index({ owner: 1, published: 1 });

module.exports = mongoose.model("Quiz", quizSchema);
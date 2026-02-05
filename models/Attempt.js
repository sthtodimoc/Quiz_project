const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    // 🔒 SNAPSHOT OF QUESTIONS (CRITICAL FIX)
    questionsSnapshot: [
      {
        text: String,
        options: [String],
        correct: Number,
      },
    ],

    answers: {
      type: Object,
      default: {},
    },

    score: {
      type: Number,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
    },

    timeTaken: {
      type: Number,
    },

    isSubmitted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // 👁️ Visibility flags
    hiddenForStudent: {
      type: Boolean,
      default: false,
      index: true,
    },

    hiddenForTeacher: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

attemptSchema.index({ studentId: 1, quizId: 1, isSubmitted: 1 });

module.exports = mongoose.model("Attempt", attemptSchema);
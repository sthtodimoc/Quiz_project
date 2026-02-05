const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middleware/auth");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const User = require("../models/User");

/**
 * =========================
 * GET TEACHER QUIZZES
 * =========================
 */
router.get(
  "/quizzes",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const filter =
        req.user.role === "admin" ? {} : { owner: req.user.id };

      const quizzes = await Quiz.find(filter).select(
        "title published timeLimit maxAttempts createdAt"
      );

      res.json(quizzes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to load quizzes" });
    }
  }
);

/**
 * =========================
 * QUIZ ANALYTICS (STATS)
 * =========================
 */
router.get(
  "/quiz/:quizId/analytics",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // 🔐 Teacher ownership check
      if (
        req.user.role === "teacher" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      // ❗ IMPORTANT:
      // We DO NOT filter by hiddenForTeacher here
      // because analytics must reflect system truth
      const attempts = await Attempt.find({
        quizId: quiz._id,
        isSubmitted: true,
      }).populate("studentId", "email");

      const scores = attempts.map((a) => a.score);

      res.json({
        quiz: {
          title: quiz.title,
          timeLimit: quiz.timeLimit,
          maxAttempts: quiz.maxAttempts,
        },
        totalAttempts: scores.length,
        averageScore:
          scores.length === 0
            ? 0
            : (
                scores.reduce((a, b) => a + b, 0) / scores.length
              ).toFixed(2),
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,

        // Teacher UI may filter these later
        attempts,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to load analytics" });
    }
  }
);

/**
 * =========================
 * EXPORT QUIZ RESULTS (CSV)
 * =========================
 */
router.get(
  "/quiz/:quizId/export",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // 🔐 Teacher ownership check
      if (
        req.user.role === "teacher" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const attempts = await Attempt.find({
        quizId: quiz._id,
        isSubmitted: true,
      }).populate("studentId", "email");

      let csv = "Student Email,Score,Submitted At\n";

      attempts.forEach((a) => {
        csv += `${a.studentId?.email || "Unknown"},${a.score},${a.submittedAt}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${quiz.title}-results.csv"`
      );

      res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to export results" });
    }
  }
);

/**
 * =========================
 * HIDE ATTEMPTS (TEACHER / ADMIN)
 * View-only deletion, NOT system deletion
 * =========================
 */
router.delete(
  "/quiz/:quizId/attempts",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const { attemptIds } = req.body; // optional array
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // 🔐 Teacher ownership check
      if (
        req.user.role === "teacher" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const filter = {
        quizId: quiz._id,
        isSubmitted: true,
      };

      // Hide selected only (gmail-style)
      if (Array.isArray(attemptIds) && attemptIds.length > 0) {
        filter._id = { $in: attemptIds };
      }

      await Attempt.updateMany(filter, {
        $set: { hiddenForTeacher: true },
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to hide attempts" });
    }
  }
);

module.exports = router;
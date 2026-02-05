const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middleware/auth");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");

/**
 * =========================
 * ANALYTICS OVERVIEW
 * =========================
 */
router.get(
  "/overview",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const quizzes =
        req.user.role === "admin"
          ? await Quiz.find()
          : await Quiz.find({ owner: req.user.id });

      const results = await Promise.all(
        quizzes.map(async (quiz) => {
          const attempts = await Attempt.find({
            quizId: quiz._id,
            isSubmitted: true,
          });

          const totalAttempts = attempts.length;
          const avg =
            totalAttempts === 0
              ? 0
              : attempts.reduce((s, a) => s + a.score, 0) /
                totalAttempts;

          return {
            quizId: quiz._id,
            title: quiz.title,
            totalAttempts,
            averageScore: Number(avg.toFixed(2)),
          };
        })
      );

      res.json(results);
    } catch {
      res.status(500).json({ message: "Failed to load analytics overview" });
    }
  }
);

/**
 * =========================
 * ANALYTICS: SINGLE QUIZ
 * =========================
 */


router.get(
  "/quiz/:quizId",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      if (
        req.user.role !== "admin" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const attempts = await Attempt.find({
        quizId: quiz._id,
        isSubmitted: true,
      })
        .populate("studentId", "email")
        .sort({ score: -1, submittedAt: 1 });

      const scores = attempts.map((a) => a.score);

      // 🏆 BUILD LEADERBOARD (best attempt per student)
      const leaderboardMap = new Map();

      for (const a of attempts) {
        const studentId = a.studentId._id.toString();
        if (!leaderboardMap.has(studentId)) {
          leaderboardMap.set(studentId, {
            student: a.studentId.email,
            score: a.score,
            submittedAt: a.submittedAt,
          });
        }
      }

      const leaderboard = Array.from(leaderboardMap.values()).map(
        (row, index) => ({
          rank: index + 1,
          ...row,
        })
      );

      res.json({
        quiz: {
          id: quiz._id,
          title: quiz.title,
          timeLimit: quiz.timeLimit,
          maxAttempts: quiz.maxAttempts,
        },
        totalAttempts: attempts.length,
        averageScore: scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
        attempts: attempts.map((a) => ({
          _id: a._id,
          studentId: a.studentId._id,
          student: a.studentId.email,
          score: a.score,
          submittedAt: a.submittedAt,
        })),
        leaderboard, // ✅ NEW
      });
    } catch {
      res.status(500).json({ message: "Failed to load quiz analytics" });
    }
  }
);





module.exports = router;

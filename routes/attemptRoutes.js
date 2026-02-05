const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middleware/auth");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * GET ATTEMPT COUNT (DO NOT CARE ABOUT VISIBILITY)
 */
router.get(
  "/count/:quizId",
  verifyToken,
  verifyRole("student"),
  async (req, res) => {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const count = await Attempt.countDocuments({
      studentId: req.user.id,
      quizId: quiz._id,
      isSubmitted: true,
    });

    res.json({ count, maxAttempts: quiz.maxAttempts });
  }
);

/**
 * START ATTEMPT
 */
router.post(
  "/start/:quizId",
  verifyToken,
  verifyRole("student"),
  async (req, res) => {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz || !quiz.published) {
      return res.status(404).json({ message: "Quiz not available" });
    }

    const attemptCount = await Attempt.countDocuments({
      studentId: req.user.id,
      quizId: quiz._id,
      isSubmitted: true,
    });

    if (attemptCount >= quiz.maxAttempts) {
      return res.status(403).json({ message: "Maximum attempts reached" });
    }

    const attempt = await Attempt.create({
      studentId: req.user.id,
      quizId: quiz._id,
    });

    res.status(201).json({ attempt });
  }
);

/**
 * ======================
 * SUBMIT ATTEMPT (FIXED)
 * ======================
 */
router.post(
  "/submit/:attemptId",
  verifyToken,
  verifyRole("student"),
  async (req, res) => {
    try {
      const { answers } = req.body;

      const attempt = await Attempt.findById(req.params.attemptId)
        .populate("quizId");

      if (!attempt || attempt.isSubmitted) {
        return res.status(400).json({ message: "Invalid attempt" });
      }

      // ⏱ Optional: time limit check (keep if you had it before)
      const elapsedMinutes =
        (Date.now() - attempt.startedAt.getTime()) / 60000;

      if (elapsedMinutes > attempt.quizId.timeLimit) {
        return res.status(403).json({ message: "Time limit exceeded" });
      }

      // ✅ CALCULATE SCORE
      let score = 0;
      attempt.quizId.questions.forEach((q, i) => {
        if (answers?.[i] === q.correct) score++;
      });

      // 🔒 SNAPSHOT QUESTIONS (CRITICAL FIX)
      attempt.questionsSnapshot = attempt.quizId.questions.map((q) => ({
        text: q.text,
        options: [...q.options],
        correct: q.correct,
      }));

      attempt.answers = answers || {};
      attempt.score = score;
      attempt.submittedAt = new Date();
      attempt.isSubmitted = true;

      await attempt.save();

      // 🔔 NOTIFY QUIZ OWNER
      const student = await User.findById(req.user.id).select("email");

      await Notification.create({
        userId: attempt.quizId.owner,
        message: `Student ${student.email} submitted "${attempt.quizId.title}" — Score: ${score}/${attempt.quizId.questions.length}`,
      });

      res.json({
        message: "Attempt submitted",
        score,
        total: attempt.quizId.questions.length,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to submit attempt" });
    }
  }
);

/**
 * STUDENT HISTORY (HIDDEN ONLY)
 */
router.get(
  "/my-attempts",
  verifyToken,
  verifyRole("student"),
  async (req, res) => {
    const attempts = await Attempt.find({
      studentId: req.user.id,
      isSubmitted: true,
      hiddenForStudent: false,
    })
      .populate("quizId", "title")
      .sort({ submittedAt: -1 });

    res.json(attempts);
  }
);

/**
 * GET SINGLE ATTEMPT WITH ANSWERS (STUDENT)
 */
router.get(
  "/:attemptId",
  verifyToken,
  verifyRole("student"),
  async (req, res) => {
    try {
      const attempt = await Attempt.findOne({
        _id: req.params.attemptId,
        isSubmitted: true,
        hiddenForStudent: false,
      }).populate("quizId", "title questions");

      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      if (attempt.studentId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(attempt);
    } catch (err) {
      res.status(500).json({ message: "Failed to load attempt" });
    }
  }
);

/**
 * STUDENT HIDE SELECTED ATTEMPTS
 */
router.delete(
  "/",
  verifyToken,
  verifyRole("student"),
  async (req, res) => {
    await Attempt.updateMany(
      { _id: { $in: req.body.ids }, studentId: req.user.id },
      { $set: { hiddenForStudent: true } }
    );

    res.json({ success: true });
  }
);

/**
 * STUDENT CLEAR HISTORY (VIEW ONLY)
 */
router.delete(
  "/clear/all",
  verifyToken,
  verifyRole("student"),
  async (req, res) => {
    await Attempt.updateMany(
      { studentId: req.user.id },
      { $set: { hiddenForStudent: true } }
    );

    res.json({ success: true });
  }
);

module.exports = router;

const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const { verifyToken, verifyRole } = require("../middleware/auth");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * =========================
 * GET QUIZ LIST
 * =========================
 */
router.get("/list", verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const isTeacher = req.user.role === "teacher";

    const quizzes = isAdmin
      ? await Quiz.find()
      : isTeacher
      ? await Quiz.find({ owner: req.user.id })
      : await Quiz.find({ published: true });

    res.json(quizzes);
  } catch {
    res.status(500).json({ message: "Failed to load quizzes" });
  }
});

/**
 * =========================
 * GET SINGLE QUIZ
 * =========================
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.user.role === "teacher") {
      if (quiz.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (req.user.role !== "admin" && !quiz.published) {
      return res.status(403).json({ message: "Quiz not published" });
    }

    res.json(quiz);
  } catch {
    res.status(400).json({ message: "Invalid quiz ID" });
  }
});

/**
 * =========================
 * CREATE QUIZ
 * =========================
 */
router.post(
  "/create",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const { title, timeLimit, maxAttempts } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ message: "Quiz title required" });
      }

      const quiz = new Quiz({
        title,
        questions: [],
        timeLimit: Number(timeLimit) || 10,
        maxAttempts: Number(maxAttempts) || 1,
        published: false,
        owner: req.user.id,
      });

      await quiz.save();
      res.status(201).json({ message: "Quiz created", quiz });
    } catch {
      res.status(500).json({ message: "Failed to create quiz" });
    }
  }
);

/**
 * =========================
 * UPDATE QUIZ SETTINGS (PHASE B)
 * =========================
 */
router.patch(
  "/:id/settings",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const { timeLimit, maxAttempts } = req.body;

      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      // 🔐 Ownership check
      if (
        req.user.role !== "admin" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (timeLimit !== undefined) {
        quiz.timeLimit = Number(timeLimit);
      }

      if (maxAttempts !== undefined) {
        quiz.maxAttempts = Number(maxAttempts);
      }

      await quiz.save();
      res.json({ message: "Quiz settings updated", quiz });
    } catch {
      res.status(500).json({ message: "Failed to update quiz settings" });
    }
  }
);

/**
 * =========================
 * ADD QUESTION
 * =========================
 */
router.post(
  "/:id/add-question",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const { text, options, correct } = req.body;

      if (!text?.trim()) {
        return res.status(400).json({ message: "Question text required" });
      }

      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: "At least 2 options required" });
      }

      if (typeof correct !== "number") {
        return res.status(400).json({ message: "Correct index required" });
      }

      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      // Ownership check (teachers)
      if (
        req.user.role !== "admin" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (correct < 0 || correct >= options.length) {
        return res.status(400).json({ message: "Invalid correct option index" });
      }

      quiz.questions.push({ text, options, correct });
      await quiz.save();

      res.json({ message: "Question added", quiz });
    } catch {
      res.status(400).json({ message: "Invalid quiz ID" });
    }
  }
);

// =========================
// DELETE QUESTION
// =========================
router.delete(
  "/:quizId/question/:index",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const { quizId, index } = req.params;

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // 🔐 Ownership check (teachers)
      if (
        req.user.role !== "admin" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const idx = Number(index);
      if (
        Number.isNaN(idx) ||
        idx < 0 ||
        idx >= quiz.questions.length
      ) {
        return res.status(400).json({ message: "Invalid question index" });
      }

      quiz.questions.splice(idx, 1);
      await quiz.save();

      res.json({
        message: "Question deleted",
        quiz,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete question" });
    }
  }
);






/**
 * =========================
 * PUBLISH / UNPUBLISH
 * =========================
 */
router.patch(
  "/:id/publish",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      // Ownership check (teachers)
      if (
        req.user.role !== "admin" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      quiz.published = !quiz.published;
      await quiz.save();

      // 🔔 NOTIFY STUDENTS ONLY WHEN PUBLISHING
      if (quiz.published) {
        const students = await User.find({ role: "student" });

        await Notification.insertMany(
          students.map((s) => ({
            userId: s._id,
            message: `New quiz published: ${quiz.title}`,
          }))
        );
      }

      res.json({ message: "Publish status updated", quiz });

    } catch {
      res.status(400).json({ message: "Invalid quiz ID" });
    }
  }
);


/**
 * =========================
 * DELETE QUIZ
 * =========================
 */
router.delete(
  "/:id",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // 🔐 Ownership check
      if (
        req.user.role !== "admin" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      await Quiz.findByIdAndDelete(req.params.id);

      res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  }
);

/**
 * =========================
 * UPDATE QUESTION
 * =========================
 */
router.patch(
  "/:quizId/question/:index",
  verifyToken,
  verifyRole("admin", "teacher"),
  async (req, res) => {
    try {
      const { quizId, index } = req.params;
      const { text, options, correct } = req.body;

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // 🔐 Ownership check (teachers)
      if (
        req.user.role !== "admin" &&
        quiz.owner.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const idx = Number(index);
      if (
        Number.isNaN(idx) ||
        idx < 0 ||
        idx >= quiz.questions.length
      ) {
        return res.status(400).json({ message: "Invalid question index" });
      }

      // ✅ Validation
      if (!text?.trim()) {
        return res.status(400).json({ message: "Question text required" });
      }

      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: "At least 2 options required" });
      }

      if (typeof correct !== "number" || correct < 0 || correct >= options.length) {
        return res.status(400).json({ message: "Invalid correct option index" });
      }

      // ✅ Update in place
      quiz.questions[idx].text = text;
      quiz.questions[idx].options = options;
      quiz.questions[idx].correct = correct;

      await quiz.save();

      res.json({
        message: "Question updated",
        quiz,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update question" });
    }
  }
);

module.exports = router;

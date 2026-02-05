const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/auth");

// GET MY NOTIFICATIONS
router.get("/", verifyToken, async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user.id,
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

// MARK AS READ
router.patch("/:id/read", verifyToken, async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) return res.sendStatus(404);

  if (notif.userId.toString() !== req.user.id) {
    return res.sendStatus(403);
  }

  notif.read = true;
  await notif.save();
  res.json({ success: true });
});

/**
 * ======================
 * DELETE SINGLE NOTIFICATION
 * ======================
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.sendStatus(404);

    if (notif.userId.toString() !== req.user.id) {
      return res.sendStatus(403);
    }

    await notif.deleteOne();
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

/**
 * ======================
 * DELETE MULTIPLE NOTIFICATIONS
 * body: { ids: [] }
 * ======================
 */
router.delete("/", verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No notifications selected" });
    }

    await Notification.deleteMany({
      _id: { $in: ids },
      userId: req.user.id,
    });

    res.json({ message: "Selected notifications deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notifications" });
  }
});

/**
 * ======================
 * CLEAR ALL NOTIFICATIONS
 * ======================
 */
router.delete("/clear/all", verifyToken, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});



module.exports = router;
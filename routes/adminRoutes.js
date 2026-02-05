const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const { verifyToken, verifyRole } = require("../middleware/auth");

/**
 * =========================
 * GET ALL USERS (ADMIN)
 * =========================
 */
router.get(
  "/users",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");

      // 🔧 FIX: normalize _id → id
      const formattedUsers = users.map((u) => ({
        _id: u._id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      }));

      res.json(formattedUsers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to load users" });
    }
  }
);

/**
 * =========================
 * UPDATE USER ROLE (ADMIN)
 * =========================
 */
router.patch(
  "/users/:id/role",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const { role } = req.body;
      const { id } = req.params;

      if (!["student", "teacher", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = role;
      user.roleRequest = undefined;
      await user.save();

      res.json({
        message: "User role updated",
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update role" });
    }
  }
);

/**
 * =========================
 * GET ROLE REQUESTS (ADMIN)
 * =========================
 */
router.get(
  "/role-requests",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const users = await User.find({
        "roleRequest.status": "pending",
      }).select("email role roleRequest");

      const requests = users.map((u) => ({
        userId: u._id,
        email: u.email,
        currentRole: u.role,
        requestedRole: u.roleRequest?.requestedRole,
        requestedAt: u.roleRequest?.requestedAt,
      }));

      res.json(requests);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to load role requests" });
    }
  }
);

/**
 * =========================
 * REVIEW ROLE REQUEST (ADMIN)
 * =========================
 */
router.patch(
  "/role-requests/:userId",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const { userId } = req.params;

      if (!["approved", "denied"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.roleRequest?.status !== "pending") {
        return res.status(400).json({ message: "No pending request" });
      }

      const requestedRole = user.roleRequest.requestedRole;

      user.roleRequest.status = status;
      user.roleRequest.reviewedAt = new Date();

      if (status === "approved" && requestedRole) {
        user.role = requestedRole;
      }

      await user.save();

      await Notification.create({
        userId: user._id,
        message:
          status === "approved"
            ? `Your role request was approved. New role: ${user.role}. Please log out and log back in to refresh access.`
            : "Your role request was denied.",
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to review role request" });
    }
  }
);

module.exports = router;

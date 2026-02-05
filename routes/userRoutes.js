const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const User = require("../models/User");

/**
 * GET MY ROLE REQUEST (STUDENT)
 */
router.get("/me/role-request", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "role roleRequest"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      role: user.role,
      roleRequest: user.roleRequest || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load role request" });
  }
});

/**
 * SUBMIT ROLE REQUEST (STUDENT)
 */
router.post("/me/role-request", verifyToken, async (req, res) => {
  try {
    const { requestedRole } = req.body;

    if (!["teacher", "admin"].includes(requestedRole)) {
      return res.status(400).json({ message: "Invalid role request" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "student") {
      return res
        .status(400)
        .json({ message: "Only students can request a role change" });
    }

    if (user.roleRequest?.status === "pending") {
      return res
        .status(400)
        .json({ message: "A request is already pending" });
    }

    user.roleRequest = {
      requestedRole,
      status: "pending",
      requestedAt: new Date(),
      reviewedAt: null,
    };

    await user.save();

    res.json({
      message: "Role request submitted",
      roleRequest: user.roleRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit role request" });
  }
});

module.exports = router;

const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Allow ONE OR MORE roles
 * Usage: verifyRole("admin")
 * Usage: verifyRole("admin", "teacher")
 */
exports.verifyRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const user = await User.findById(req.user.id).select("role");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user.role = user.role;

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to verify role" });
    }
  };
};

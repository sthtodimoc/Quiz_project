const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const quizRoutes = require("./routes/quizRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");


const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);
app.use("/attempt", attemptRoutes);
app.use("/teacher", teacherRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/admin", adminRoutes);
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);




const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online_quiz_platform";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

import { Routes, Route } from "react-router-dom";
import QuizList from "./pages/QuizList";
import TakeQuiz from "./pages/TakeQuiz";
import History from "./pages/History";
import CreateQuiz from "./pages/CreateQuiz";
import AddQuestion from "./AddQuestion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import ReviewAttempt from "./pages/ReviewAttempt";
import AdminAnalytics from "./pages/AdminAnalytics";
import Notifications from "./pages/Notifications";




// 🧑‍🏫 Teacher pages (we will create these next)
import TeacherDashboard from "./pages/TeacherDashboard";
import QuizAnalytics from "./pages/QuizAnalytics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/quizzes" element={<QuizList />} />
      <Route path="/quiz/create" element={<CreateQuiz />} />
      <Route path="/quiz/:quizId" element={<TakeQuiz />} />
      <Route path="/quiz/:quizId/add-question" element={<AddQuestion />} />

      <Route path="/history" element={<History />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/attempt/:attemptId/review" element={<ReviewAttempt />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/notifications" element={<Notifications />} />

      {/* 🧑‍🏫 TEACHER */}
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
      <Route
        path="/teacher/quiz/:quizId/analytics"
        element={<QuizAnalytics />}
      />
    </Routes>
  );
}

export default App;
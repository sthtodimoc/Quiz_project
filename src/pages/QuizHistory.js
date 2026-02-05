import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";

function QuizHistory() {
  const { studentId } = useParams();

  return (
    <div className="app-page">
      <div className="panel-card">
        <BackButton />

        <h2 className="page-title">
          Quiz Results for student #{studentId}
        </h2>
        <p className="page-subtitle">Recent attempts</p>

        <div className="glass-list">
          <div className="glass-item">
            <strong>React Quiz</strong>
            <div className="muted">Score: 1/2</div>
          </div>
          <div className="glass-item">
            <strong>JS Quiz</strong>
            <div className="muted">Score: 2/3</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizHistory;

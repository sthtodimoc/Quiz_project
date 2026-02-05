function QuestionEditor({ question, onChange, onRemove }) {
  const { text, options, correctIndex } = question;

  const updateField = (field, value) => {
    onChange({ ...question, [field]: value });
  };

  const updateOption = (i, value) => {
    const newOptions = options.map((opt, idx) =>
      idx === i ? value : opt
    );
    updateField('options', newOptions);
  };

  return (
    <div className="glass-item" style={{ marginBottom: 12 }}>
      <input
        className="input-dark"
        placeholder="Question text"
        value={text}
        onChange={e => updateField("text", e.target.value)}
      />

      {options.map((opt, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            className="input-dark"
            value={opt}
            onChange={e => updateOption(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`}
          />
          <label className="choice-row">
            <span className="muted">Correct</span>
            <input
              type="radio"
              checked={correctIndex === idx}
              onChange={() => updateField("correctIndex", idx)}
            />
          </label>
        </div>
      ))}

      <div className="action-row" style={{ marginTop: 10 }}>
        <button type="button" className="delete-btn" onClick={onRemove}>
          Remove question
        </button>
      </div>
    </div>
  );
}

export default QuestionEditor;

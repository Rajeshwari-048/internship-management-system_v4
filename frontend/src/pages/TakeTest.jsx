import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';

export default function TakeTest() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    api
      .get(`/tests/take/${applicationId}`)
      .then((r) => {
        setTest(r.data);
        setAnswers(r.data.questions.map(() => null));
        setSecondsLeft(r.data.durationMinutes * 60);
      })
      .catch((e) => setError(errMsg(e)));
  }, [applicationId]);

  const submit = useCallback(
    async (auto = false) => {
      if (submitted.current) return;
      submitted.current = true;
      setBusy(true);
      try {
        await api.post(`/tests/submit/${applicationId}`, { answers });
        navigate('/results', { state: { notice: auto ? 'Time is over - your test was submitted.' : 'Test submitted.' } });
      } catch (e) {
        submitted.current = false;
        setBusy(false);
        setError(errMsg(e));
      }
    },
    [answers, applicationId, navigate]
  );

  // Countdown; submits automatically at 0
  useEffect(() => {
    if (secondsLeft === null) return undefined;
    if (secondsLeft <= 0) {
      submit(true);
      return undefined;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submit]);

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-outline" onClick={() => navigate('/tests')}>Back to tests</button>
      </div>
    );
  }
  if (!test) return <p className="muted">Loading test...</p>;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const answered = answers.filter((a) => a !== null).length;

  const confirmSubmit = () => {
    if (answered < answers.length && !window.confirm(`You answered ${answered} of ${answers.length}. Submit anyway?`)) return;
    submit(false);
  };

  return (
    <div>
      <div className="page-head">
        <h1>{test.title}</h1>
        <div className={`timer ${secondsLeft < 60 ? 'danger' : ''}`}>⏱ {mm}:{ss}</div>
      </div>
      <p className="muted">
        {answers.length} questions · pass mark {test.passPercent}% · answered {answered}/{answers.length}
      </p>

      {test.questions.map((q, i) => (
        <div className="card question" key={i}>
          <strong>{i + 1}. {q.question}</strong>
          {q.options.map((o, j) => (
            <label className="option" key={j}>
              <input
                type="radio"
                name={`q${i}`}
                checked={answers[i] === j}
                onChange={() => setAnswers(answers.map((a, k) => (k === i ? j : a)))}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      ))}

      <div className="row-actions">
        <button className="btn btn-primary" disabled={busy} onClick={confirmSubmit}>
          {busy ? 'Submitting...' : 'Submit test'}
        </button>
      </div>
    </div>
  );
}

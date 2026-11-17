import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

const blankQuestion = () => ({ question: '', options: ['', '', '', ''], correctIndex: 0 });

// Company/admin: write the aptitude test for an internship
export default function ManageTests() {
  const [internships, setInternships] = useState([]);
  const [internshipId, setInternshipId] = useState('');
  const [form, setForm] = useState({ title: 'Aptitude Test', durationMinutes: 20, passPercent: 50 });
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api
      .get('/internships')
      .then((r) => {
        setInternships(r.data);
        if (r.data[0]) setInternshipId(r.data[0]._id);
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  // Load the saved test whenever another internship is chosen
  useEffect(() => {
    if (!internshipId) return;
    setNotice('');
    api
      .get(`/tests/internship/${internshipId}`)
      .then((r) => {
        const t = r.data;
        if (t && t.questions) {
          setForm({ title: t.title, durationMinutes: t.durationMinutes, passPercent: t.passPercent });
          setQuestions(t.questions.length ? t.questions : [blankQuestion()]);
        } else {
          setForm({ title: 'Aptitude Test', durationMinutes: 20, passPercent: 50 });
          setQuestions([blankQuestion()]);
        }
      })
      .catch((e) => setError(errMsg(e)));
  }, [internshipId]);

  const setQ = (i, patch) =>
    setQuestions(questions.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const setOption = (i, j, value) =>
    setQ(i, { options: questions[i].options.map((o, k) => (k === j ? value : o)) });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.put(`/tests/internship/${internshipId}`, { ...form, questions });
      setNotice('Aptitude test saved. Now set applications to "Aptitude Test" to invite students.');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Aptitude tests</h1>
      </div>
      <p className="muted">
        Write multiple-choice questions for an internship. A student can take the test after you
        set their application to <strong>Aptitude Test</strong> (resume selected). Results are
        marked automatically.
      </p>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}
      {notice && <div className="alert alert-success" onClick={() => setNotice('')}>{notice}</div>}

      {internships.length === 0 ? (
        <p className="muted">Create an internship first.</p>
      ) : (
        <form onSubmit={save}>
          <div className="card form-card">
            <label>Internship</label>
            <select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
              {internships.map((i) => (
                <option key={i._id} value={i._id}>{i.title} - {i.company}</option>
              ))}
            </select>
            <div className="grid-3">
              <div>
                <label>Test title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label>Time limit (minutes)</label>
                <input
                  type="number" min="1"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                />
              </div>
              <div>
                <label>Pass mark (%)</label>
                <input
                  type="number" min="0" max="100"
                  value={form.passPercent}
                  onChange={(e) => setForm({ ...form, passPercent: e.target.value })}
                />
              </div>
            </div>
          </div>

          {questions.map((q, i) => (
            <div className="card form-card" key={i}>
              <div className="card-top">
                <h3>Question {i + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button" className="btn btn-outline"
                    onClick={() => setQuestions(questions.filter((_, k) => k !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                placeholder="Type the question"
                value={q.question}
                onChange={(e) => setQ(i, { question: e.target.value })}
              />
              {q.options.map((o, j) => (
                <div className="option-edit" key={j}>
                  <input
                    type="radio"
                    name={`correct${i}`}
                    title="Correct answer"
                    checked={Number(q.correctIndex) === j}
                    onChange={() => setQ(i, { correctIndex: j })}
                  />
                  <input
                    placeholder={`Option ${j + 1}`}
                    value={o}
                    onChange={(e) => setOption(i, j, e.target.value)}
                  />
                </div>
              ))}
              <p className="muted small">Select the round button next to the correct answer.</p>
            </div>
          ))}

          <div className="row-actions">
            <button type="button" className="btn btn-outline" onClick={() => setQuestions([...questions, blankQuestion()])}>
              + Add question
            </button>
            <button className="btn btn-primary">Save test</button>
          </div>
        </form>
      )}
    </div>
  );
}

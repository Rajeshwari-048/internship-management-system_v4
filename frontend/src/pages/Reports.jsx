import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

const emptyReport = { internshipId: '', weekNumber: 1, title: '', workDone: '', hoursSpent: 0 };

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin' || user.role === 'company'; // staff who review reports
  const [reports, setReports] = useState([]);
  const [approved, setApproved] = useState([]); // approved internships (student)
  const [form, setForm] = useState(emptyReport);
  const [review, setReview] = useState({}); // { [reportId]: { feedback, rating } }
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    api.get('/reports').then((r) => setReports(r.data)).catch((e) => setError(errMsg(e)));
    if (!isAdmin) {
      api
        .get('/applications', { params: { status: 'approved' } })
        .then((r) => {
          setApproved(r.data);
          setForm((f) => (f.internshipId || !r.data[0] ? f : { ...f, internshipId: r.data[0].internship._id }));
        })
        .catch((e) => setError(errMsg(e)));
    }
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/reports', {
        ...form,
        weekNumber: Number(form.weekNumber),
        hoursSpent: Number(form.hoursSpent),
      });
      setNotice('Report submitted');
      setForm({ ...emptyReport, internshipId: form.internshipId });
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const setRev = (id, patch) => setReview({ ...review, [id]: { ...review[id], ...patch } });

  const sendReview = async (id) => {
    const r = review[id] || {};
    try {
      await api.put(`/reports/${id}/review`, {
        feedback: r.feedback || '',
        rating: r.rating ? Number(r.rating) : undefined,
      });
      setNotice('Review saved');
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div>
      <h1>{isAdmin ? 'Weekly reports' : 'My weekly reports'}</h1>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}
      {notice && <div className="alert alert-success" onClick={() => setNotice('')}>{notice}</div>}

      {!isAdmin && (
        <div className="card form-card">
          <h3>Submit a report</h3>
          {approved.length === 0 ? (
            <p className="muted">
              You can submit reports once an application of yours is approved.
            </p>
          ) : (
            <form onSubmit={submit}>
              <div className="grid-3">
                <div>
                  <label>Internship</label>
                  <select name="internshipId" value={form.internshipId} onChange={onChange} required>
                    {approved.map((a) => (
                      <option key={a._id} value={a.internship._id}>
                        {a.internship.title} — {a.internship.company}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Week number</label>
                  <input type="number" min="1" name="weekNumber" value={form.weekNumber} onChange={onChange} required />
                </div>
                <div>
                  <label>Hours spent</label>
                  <input type="number" min="0" name="hoursSpent" value={form.hoursSpent} onChange={onChange} />
                </div>
              </div>
              <label>Title</label>
              <input name="title" value={form.title} onChange={onChange} required />
              <label>Work done this week</label>
              <textarea name="workDone" rows={4} value={form.workDone} onChange={onChange} required />
              <button className="btn btn-primary">Submit report</button>
            </form>
          )}
        </div>
      )}

      {reports.length === 0 && <p className="muted">No reports yet.</p>}

      <div className="reports-list">
        {reports.map((r) => (
          <div className="card report" key={r._id}>
            <div className="card-top">
              <h3>Week {r.weekNumber}: {r.title}</h3>
              <span className={`pill ${r.status === 'reviewed' ? 'approved' : 'pending'}`}>{r.status}</span>
            </div>
            <p className="muted small">
              {isAdmin && <>{r.student?.name} · </>}
              {r.internship?.title} · {r.hoursSpent} hrs · {new Date(r.createdAt).toLocaleDateString()}
            </p>
            <p>{r.workDone}</p>

            {r.status === 'reviewed' && (
              <div className="feedback">
                <strong>Feedback{r.rating ? ` (${r.rating}/5)` : ''}:</strong> {r.feedback || '—'}
              </div>
            )}

            {isAdmin && (
              <div className="review-box">
                <textarea
                  rows={2}
                  placeholder="Feedback for the student"
                  defaultValue={r.feedback}
                  onChange={(e) => setRev(r._id, { feedback: e.target.value })}
                />
                <select
                  defaultValue={r.rating || ''}
                  onChange={(e) => setRev(r._id, { rating: e.target.value })}
                >
                  <option value="">Rating</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => sendReview(r._id)}>
                  Save review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

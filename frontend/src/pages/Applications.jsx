import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

// Hiring pipeline, in order. "Rejected" is a separate end state.
const STAGES = ['Applied', 'Under Review', 'Aptitude Test', 'Processing', 'Selected'];
const ALL_STAGES = [...STAGES, 'Rejected'];

const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

function StageTracker({ stage }) {
  const rejected = stage === 'Rejected';
  const current = STAGES.indexOf(stage);
  return (
    <div className="tracker">
      {STAGES.map((s, i) => (
        <span
          key={s}
          className={`step ${!rejected && i < current ? 'done' : ''} ${!rejected && i === current ? 'current' : ''}`}
        >
          {s}
        </span>
      ))}
      {rejected && <span className="step rejected">Rejected</span>}
    </div>
  );
}

export default function Applications() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin' || user.role === 'company'; // staff: can view resumes and reply
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    api
      .get('/applications', { params: { stage: filter } })
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMsg(e)));
  };

  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStage = async (a, stage) => {
    if (stage === a.stage) return;
    const adminRemarks = window.prompt(`Move to "${stage}". Reply message for the student (optional):`);
    if (adminRemarks === null) return; // cancelled
    try {
      await api.put(`/applications/${a._id}/status`, { stage, adminRemarks });
      setNotice(`Reply sent: application moved to ${stage}`);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const withdraw = async (id) => {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      setNotice('Application withdrawn');
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  // Resume files are protected, so fetch with the JWT and open the blob
  const openResume = async (a) => {
    try {
      const r = await api.get(`/applications/${a._id}/resume`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError('Could not open the resume file');
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>{user.role === 'admin' ? 'All applications' : isAdmin ? 'Applications received' : 'Internships I applied for'}</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All stages</option>
          {ALL_STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}
      {notice && <div className="alert alert-success" onClick={() => setNotice('')}>{notice}</div>}

      {items.length === 0 ? (
        <p className="muted">No applications yet.</p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Student</th>}
                <th>Internship</th>
                <th>Applied on</th>
                <th>Stage</th>
                <th>Resume &amp; details</th>
                <th>{isAdmin ? 'Reply (set stage)' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  {isAdmin && (
                    <td>
                      <strong>{a.student?.name}</strong>
                      <div className="muted small">{a.student?.email}</div>
                      <div className="muted small">{a.student?.college}</div>
                    </td>
                  )}
                  <td>
                    <strong>{a.internship?.title}</strong>
                    <div className="muted small">{a.internship?.company}</div>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    {isAdmin ? (
                      <span className={`pill stage-${slug(a.stage)}`}>{a.stage}</span>
                    ) : (
                      <>
                        <StageTracker stage={a.stage} />
                        {a.stage === 'Aptitude Test' && (
                          <div className="small">
                            Resume selected. <Link to="/tests">Take the aptitude test</Link>
                          </div>
                        )}
                        {a.history?.length > 1 && (
                          <div className="muted small history">
                            Last update:{' '}
                            {new Date(a.history[a.history.length - 1].date).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="small">
                    {a.coverLetter && <div>{a.coverLetter}</div>}
                    {a.testResult?.submittedAt && (
                      <div>
                        📝 Aptitude: {a.testResult.score}/{a.testResult.total} ({a.testResult.percent}%){' '}
                        <strong>{a.testResult.passed ? 'Passed' : 'Not passed'}</strong>
                      </div>
                    )}
                    {a.hasResumeFile && (
                      <div>
                        <button className="link-btn" onClick={() => openResume(a)}>
                          📄 {a.resumeOriginalName || 'View resume'}
                        </button>
                      </div>
                    )}
                    {a.resumeLink && (
                      <div>
                        <a href={a.resumeLink} target="_blank" rel="noreferrer">Resume link</a>
                      </div>
                    )}
                    {a.adminRemarks && <div className="muted">Reply: {a.adminRemarks}</div>}
                  </td>
                  <td>
                    {isAdmin ? (
                      <select value={a.stage} onChange={(e) => changeStage(a, e.target.value)}>
                        {ALL_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      a.status === 'pending' && (
                        <button className="btn btn-outline" onClick={() => withdraw(a._id)}>
                          Withdraw
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

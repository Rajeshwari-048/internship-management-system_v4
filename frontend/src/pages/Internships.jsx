import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Internships() {
  const { user } = useAuth();
  const canManage = user.role === 'admin' || user.role === 'company';
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [mode, setMode] = useState('');
  const type = params.get('type') || ''; // '', 'Free' or 'Paid'
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [applying, setApplying] = useState(null); // internship being applied to
  const [apply, setApply] = useState({ coverLetter: '', resumeLink: '' });
  const [resumeFile, setResumeFile] = useState(null);

  const load = () => {
    api
      .get('/internships', { params: { search, mode, type } })
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMsg(e)));
  };

  useEffect(() => {
    const t = setTimeout(load, 250); // small debounce for the search box
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, mode, type]);

  const setType = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('type', value);
    else next.delete('type');
    setParams(next);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this internship and all its applications?')) return;
    try {
      await api.delete(`/internships/${id}`);
      setNotice('Internship deleted');
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const toggleStatus = async (it) => {
    try {
      await api.put(`/internships/${it._id}`, { status: it.status === 'open' ? 'closed' : 'open' });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const form = new FormData();
      form.append('internshipId', applying._id);
      form.append('coverLetter', apply.coverLetter);
      form.append('resumeLink', apply.resumeLink);
      if (resumeFile) form.append('resume', resumeFile);
      await api.post('/applications', form);
      setNotice(`Applied to "${applying.title}" successfully. Track the reply in Company Replies.`);
      setApplying(null);
      setApply({ coverLetter: '', resumeLink: '' });
      setResumeFile(null);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>{user.role === 'company' ? 'My internships' : 'Internships'}</h1>
        {canManage && (
          <Link className="btn btn-primary" to="/internships/new">+ New internship</Link>
        )}
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}
      {notice && <div className="alert alert-success" onClick={() => setNotice('')}>{notice}</div>}

      <div className="type-tabs">
        {[['', 'All'], ['Free', 'Free internships'], ['Paid', 'Paid internships']].map(([value, label]) => (
          <button
            key={label}
            className={`type-tab ${type === value ? 'active' : ''}`}
            onClick={() => setType(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="filters">
        <input
          placeholder="Search by title, company or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">All modes</option>
          <option>Remote</option>
          <option>Onsite</option>
          <option>Hybrid</option>
        </select>
      </div>

      {items.length === 0 && <p className="muted">No internships found.</p>}

      <div className="cards-grid">
        {items.map((it) => (
          <div className="card internship" key={it._id}>
            <div className="card-top">
              <h3>{it.title}</h3>
              <span className={`pill type-${(it.internshipType || '').toLowerCase()}`}>
                {it.internshipType}
              </span>
            </div>
            <p className="company">{it.company}</p>
            <p className="desc">{it.description}</p>
            <ul className="meta">
              <li>📍 {it.location} ({it.mode})</li>
              <li>💰 {it.stipend ? `₹${it.stipend}/month` : 'Free (no stipend)'}</li>
              <li>⏱ {it.durationMonths} month(s) · {it.openings} opening(s)</li>
              <li>📅 Apply by {new Date(it.deadline).toLocaleDateString()}</li>
              {canManage && <li>Status: <span className={`pill ${it.status}`}>{it.status}</span></li>}
            </ul>
            <div className="tags">
              {it.skillsRequired.map((s) => <span className="tag" key={s}>{s}</span>)}
            </div>
            <div className="row-actions">
              {canManage ? (
                <>
                  <Link className="btn btn-outline" to={`/internships/${it._id}/edit`}>Edit</Link>
                  <button className="btn btn-outline" onClick={() => toggleStatus(it)}>
                    {it.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(it._id)}>Delete</button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setApplying(it)}>Apply now</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {applying && (
        <div className="modal-backdrop" onClick={() => setApplying(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2>Apply: {applying.title}</h2>
            <p className="muted">{applying.company}</p>
            <form onSubmit={submitApplication}>
              <label>Cover letter</label>
              <textarea
                rows={5}
                value={apply.coverLetter}
                onChange={(e) => setApply({ ...apply, coverLetter: e.target.value })}
                placeholder="Why are you a good fit?"
              />
              <label>Upload resume (PDF, DOC or DOCX, max 5 MB)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files[0] || null)}
              />
              <label>Or resume link (Google Drive, LinkedIn, etc.)</label>
              <input
                value={apply.resumeLink}
                onChange={(e) => setApply({ ...apply, resumeLink: e.target.value })}
                placeholder="https://..."
              />
              <div className="row-actions">
                <button className="btn btn-primary">Submit application</button>
                <button type="button" className="btn btn-outline" onClick={() => setApplying(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

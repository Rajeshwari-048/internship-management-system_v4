import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

const empty = {
  title: '',
  company: '',
  description: '',
  location: 'Remote',
  mode: 'Remote',
  stipend: 0,
  durationMonths: 3,
  skillsRequired: '',
  openings: 1,
  deadline: '',
  status: 'open',
};

export default function InternshipForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCompany = user.role === 'company';
  const [form, setForm] = useState(isCompany ? { ...empty, company: user.companyName || '' } : empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/internships/${id}`)
      .then((r) => {
        const it = r.data;
        setForm({
          ...it,
          skillsRequired: (it.skillsRequired || []).join(', '),
          deadline: it.deadline ? it.deadline.slice(0, 10) : '',
        });
      })
      .catch((e) => setError(errMsg(e)));
  }, [id, editing]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      title: form.title,
      company: form.company,
      description: form.description,
      location: form.location,
      mode: form.mode,
      stipend: Number(form.stipend),
      durationMonths: Number(form.durationMonths),
      openings: Number(form.openings),
      deadline: form.deadline,
      status: form.status,
      skillsRequired: form.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) await api.put(`/internships/${id}`, payload);
      else await api.post('/internships', payload);
      navigate('/internships');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card form-card">
      <h1>{editing ? 'Edit internship' : 'New internship'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="grid-2">
          <div>
            <label>Title</label>
            <input name="title" value={form.title} onChange={onChange} required />
          </div>
          <div>
            <label>Company</label>
            <input name="company" value={form.company} onChange={onChange} required readOnly={isCompany} />
          </div>
        </div>
        <label>Description</label>
        <textarea name="description" rows={4} value={form.description} onChange={onChange} required />
        <div className="grid-3">
          <div>
            <label>Location</label>
            <input name="location" value={form.location} onChange={onChange} />
          </div>
          <div>
            <label>Mode</label>
            <select name="mode" value={form.mode} onChange={onChange}>
              <option>Remote</option>
              <option>Onsite</option>
              <option>Hybrid</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select name="status" value={form.status} onChange={onChange}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="grid-3">
          <div>
            <label>Stipend (₹/month) - 0 means a free internship</label>
            <input type="number" min="0" name="stipend" value={form.stipend} onChange={onChange} />
          </div>
          <div>
            <label>Duration (months)</label>
            <input type="number" min="1" name="durationMonths" value={form.durationMonths} onChange={onChange} />
          </div>
          <div>
            <label>Openings</label>
            <input type="number" min="1" name="openings" value={form.openings} onChange={onChange} />
          </div>
        </div>
        <div className="grid-2">
          <div>
            <label>Application deadline</label>
            <input type="date" name="deadline" value={form.deadline} onChange={onChange} required />
          </div>
          <div>
            <label>Skills required (comma separated)</label>
            <input name="skillsRequired" value={form.skillsRequired} onChange={onChange} />
          </div>
        </div>
        <div className="row-actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving...' : editing ? 'Update' : 'Create'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/internships')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

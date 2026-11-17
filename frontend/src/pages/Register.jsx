import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    college: '',
    department: '',
    skills: '',
    role: 'student',
    companyName: '',
    industry: '',
    website: '',
    location: '',
    about: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card card">
      <h2>Create account</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>I am a</label>
        <select name="role" value={form.role} onChange={onChange}>
          <option value="student">Student (looking for internships)</option>
          <option value="company">Company (offering internships)</option>
        </select>
        <label>{form.role === 'company' ? 'Contact person name' : 'Full name'}</label>
        <input name="name" value={form.name} onChange={onChange} required />
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={onChange} required />
        <label>Password (min 6 characters)</label>
        <input type="password" name="password" value={form.password} onChange={onChange} minLength={6} required />
        {form.role === 'company' ? (
          <>
            <label>Company name</label>
            <input name="companyName" value={form.companyName} onChange={onChange} required />
            <div className="grid-2">
              <div>
                <label>Industry</label>
                <input name="industry" value={form.industry} onChange={onChange} placeholder="Software, Finance..." />
              </div>
              <div>
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label>Location</label>
                <input name="location" value={form.location} onChange={onChange} />
              </div>
              <div>
                <label>Website</label>
                <input name="website" value={form.website} onChange={onChange} placeholder="https://..." />
              </div>
            </div>
            <label>About the company</label>
            <textarea name="about" rows={3} value={form.about} onChange={onChange} />
          </>
        ) : (
          <>
        <div className="grid-2">
          <div>
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} />
          </div>
          <div>
            <label>Department</label>
            <input name="department" value={form.department} onChange={onChange} />
          </div>
        </div>
        <label>College</label>
        <input name="college" value={form.college} onChange={onChange} />
        <label>Skills (comma separated)</label>
        <input name="skills" value={form.skills} onChange={onChange} placeholder="React, Node.js, MongoDB" />
          </>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating...' : 'Register'}
        </button>
      </form>
      <p className="muted center">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

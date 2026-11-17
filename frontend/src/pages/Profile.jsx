import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    college: user.college || '',
    department: user.department || '',
    skills: (user.skills || []).join(', '),
    companyName: user.companyName || '',
    industry: user.industry || '',
    website: user.website || '',
    location: user.location || '',
    about: user.about || '',
  });
  const isCompany = user.role === 'company';
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const res = await api.put('/auth/me', {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setUser(res.data.user);
      setNotice('Profile updated');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="card form-card">
      <h1>{isCompany ? 'Company profile' : 'My profile'}</h1>
      <p className="muted">{user.email}</p>
      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      <form onSubmit={onSubmit}>
        <label>Full name</label>
        <input name="name" value={form.name} onChange={onChange} required />
        {isCompany ? (
          <>
            <label>Company name</label>
            <input name="companyName" value={form.companyName} onChange={onChange} required />
            <div className="grid-2">
              <div>
                <label>Industry</label>
                <input name="industry" value={form.industry} onChange={onChange} />
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
                <input name="website" value={form.website} onChange={onChange} />
              </div>
            </div>
            <label>About the company</label>
            <textarea name="about" rows={4} value={form.about} onChange={onChange} />
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
        <input name="skills" value={form.skills} onChange={onChange} />
          </>
        )}
        <button className="btn btn-primary">Save changes</button>
      </form>
    </div>
  );
}

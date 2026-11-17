import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card card">
      <h2>Welcome back</h2>
      <p className="muted">Sign in to manage your internships.</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={onChange} required />
        <label>Password</label>
        <input type="password" name="password" value={form.password} onChange={onChange} required />
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <p className="muted center">
        New student? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}

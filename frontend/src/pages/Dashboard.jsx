import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

// A stat card; when `to` is given the whole card is a link
const Stat = ({ label, value, tone, to }) => {
  const body = (
    <div className={`stat card ${tone || ''} ${to ? 'clickable' : ''}`}>
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
  return to ? <Link to={to} className="stat-link">{body}</Link> : body;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [applied, setApplied] = useState([]); // student's applications
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
    if (user.role === 'student') {
      api.get('/applications').then((r) => setApplied(r.data)).catch(() => {});
    }
  }, [user.role]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <p className="muted">Loading dashboard...</p>;

  if (user.role === 'student') {
    return (
      <div>
        <div className="hero">
          <h1>Internship Portal</h1>
          <p>
            Welcome, {user.name}. Find internships, apply with your resume and track the company's
            reply.
          </p>
        </div>

        <h3 className="section-title">Available internships</h3>
        <div className="stats-grid">
          <Stat label="Companies offering internships" value={stats.companies} to="/companies" />
          <Stat label="Open internships" value={stats.openInternships} tone="green" to="/internships" />
          <Stat label="Free internships" value={stats.freeInternships} tone="amber" to="/internships?type=Free" />
          <Stat label="Paid internships" value={stats.paidInternships} to="/internships?type=Paid" />
        </div>

        <h3 className="section-title">My applications</h3>
        <div className="stats-grid">
          <Stat label="Applied" value={stats.applications} to="/applications" />
          <Stat label="Under review" value={stats.underReview} tone="amber" to="/replies" />
          <Stat label="Aptitude test to take" value={stats.aptitude} tone="amber" to="/tests" />
          <Stat label="Processing" value={stats.processing} tone="amber" to="/replies" />
          <Stat label="Selected" value={stats.selected} tone="green" to="/replies" />
          <Stat label="Rejected" value={stats.rejected} tone="red" to="/replies" />
        </div>

        <h3 className="section-title">Internships I applied for</h3>
        {applied.length === 0 ? (
          <p className="muted">You have not applied yet.</p>
        ) : (
          <div className="card">
            {applied.slice(0, 5).map((a) => (
              <div className="company-row" key={a._id}>
                <span>
                  <strong>{a.internship?.title}</strong>
                  <span className="muted small"> · {a.internship?.company} · {new Date(a.createdAt).toLocaleDateString()}</span>
                </span>
                <span className={`pill stage-${a.stage.toLowerCase().replace(/\s+/g, '-')}`}>{a.stage}</span>
              </div>
            ))}
            <div className="row-actions">
              <Link className="btn btn-outline" to="/applications">See all applied internships</Link>
            </div>
          </div>
        )}

        <div className="row-actions">
          <Link className="btn btn-primary" to="/internships">Browse internships</Link>
          <Link className="btn btn-outline" to="/companies">Company details</Link>
          <Link className="btn btn-outline" to="/ranking">Company ranking</Link>
          <Link className="btn btn-outline" to="/replies">Company replies</Link>
          <Link className="btn btn-outline" to="/selected">Selected students</Link>
        </div>
      </div>
    );
  }

  if (user.role === 'company') {
    return (
      <div>
        <div className="hero">
          <h1>{user.companyName || 'Company'} dashboard</h1>
          <p>Post internships, review student resumes and reply with a stage.</p>
        </div>
        <div className="stats-grid">
          <Stat label="My internships" value={stats.internships} to="/internships" />
          <Stat label="Open internships" value={stats.openInternships} tone="green" to="/internships" />
          <Stat label="Applications received" value={stats.applications} to="/applications" />
          <Stat label="New (not yet viewed)" value={stats.applied} tone="amber" to="/applications" />
          <Stat label="Under review" value={stats.underReview} tone="amber" to="/applications" />
          <Stat label="Aptitude test stage" value={stats.aptitude} tone="amber" to="/applications" />
          <Stat label="Processing" value={stats.processing} tone="amber" to="/applications" />
          <Stat label="Selected" value={stats.selected} tone="green" to="/selected" />
          <Stat label="Rejected" value={stats.rejected} tone="red" to="/applications" />
        </div>
        <div className="row-actions">
          <Link className="btn btn-primary" to="/internships/new">+ Post internship</Link>
          <Link className="btn btn-outline" to="/applications">Review applications</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Hello, {user.name} 👋</h1>
      <p className="muted">Here is an overview of the internship program.</p>
      <div className="stats-grid">
        <Stat label="Students" value={stats.students} />
        <Stat label="Internships" value={stats.internships} />
        <Stat label="Open positions" value={stats.openInternships} tone="green" />
        <Stat label="Applications" value={stats.applications} />
        <Stat label="In progress" value={stats.pending} tone="amber" />
        <Stat label="Selected" value={stats.approved} tone="green" />
        <Stat label="Rejected" value={stats.rejected} tone="red" />
        <Stat label="Reports submitted" value={stats.reports} />
      </div>
      <div className="row-actions">
        <Link className="btn btn-primary" to="/internships">Manage internships</Link>
        <Link className="btn btn-outline" to="/applications">View applications</Link>
      </div>
    </div>
  );
}

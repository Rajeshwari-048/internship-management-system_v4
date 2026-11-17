import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Each role gets its own set of tabs
const TABS = {
  student: [
    ['/', 'Dashboard'],
    ['/companies', 'Companies'],
    ['/ranking', 'Company Ranking'],
    ['/internships', 'Internships'],
    ['/applications', 'Applied Internships'],
    ['/replies', 'Company Replies'],
    ['/tests', 'Aptitude Tests'],
    ['/results', 'Test Results'],
    ['/selected', 'Selected Students'],
    ['/reports', 'My Reports'],
    ['/profile', 'Profile'],
  ],
  company: [
    ['/', 'Dashboard'],
    ['/internships', 'My Internships'],
    ['/applications', 'Applications'],
    ['/manage-tests', 'Aptitude Tests'],
    ['/results', 'Test Results'],
    ['/selected', 'Selected Students'],
    ['/ranking', 'Company Ranking'],
    ['/reports', 'Reports'],
    ['/profile', 'Company Profile'],
  ],
  admin: [
    ['/', 'Dashboard'],
    ['/companies', 'Companies'],
    ['/ranking', 'Company Ranking'],
    ['/internships', 'Internships'],
    ['/applications', 'Applications'],
    ['/manage-tests', 'Aptitude Tests'],
    ['/results', 'Test Results'],
    ['/selected', 'Selected Students'],
    ['/reports', 'Reports'],
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <span className="brand">InternHub</span>
        {user && (
          <nav className="nav-links">
            {(TABS[user.role] || TABS.student).map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
            ))}
          </nav>
        )}
        {user && (
          <div className="nav-user">
            <span className="muted">
              {user.name} <span className="badge">{user.role}</span>
            </span>
            <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/companies').then((r) => setCompanies(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const shown = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalFree = companies.reduce((n, c) => n + c.free, 0);
  const totalPaid = companies.reduce((n, c) => n + c.paid, 0);

  return (
    <div>
      <div className="page-head">
        <h1>Companies</h1>
        <Link className="btn btn-outline" to="/ranking">🏆 Company ranking</Link>
      </div>
      <p className="muted">
        {companies.length} companies are offering internships right now ({totalFree} free,{' '}
        {totalPaid} paid).
      </p>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}

      <div className="filters">
        <input
          placeholder="Search company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {shown.length === 0 && <p className="muted">No companies found.</p>}

      <div className="cards-grid">
        {shown.map((c) => (
          <div className="card internship" key={c.name}>
            <div className="card-top">
              <h3>{c.name}</h3>
              <span className="pill open">{c.internships.length} open</span>
            </div>
            {c.industry && <p className="company">{c.industry}</p>}
            {c.about && <p className="desc">{c.about}</p>}
            <ul className="meta">
              {c.locations.length > 0 && <li>📍 {c.locations.join(', ')}</li>}
              {c.website && (
                <li>
                  🌐 <a href={c.website} target="_blank" rel="noreferrer">{c.website}</a>
                </li>
              )}
              <li>
                🎓 {c.free} free · {c.paid} paid internship(s) open
              </li>
              <li>
                🏆 {c.selected} student(s) selected ({c.selectedFree} in free, {c.selectedPaid} in paid
                internships) from {c.applications} application(s)
              </li>
            </ul>
            <div className="company-list">
              {c.internships.map((it) => (
                <div className="company-row" key={it._id}>
                  <span>
                    {it.title}
                    <span className="muted small"> · {it.mode} · {it.durationMonths} mo</span>
                  </span>
                  <span className={`pill type-${it.internshipType.toLowerCase()}`}>
                    {it.internshipType}
                  </span>
                </div>
              ))}
            </div>
            <div className="row-actions">
              <Link className="btn btn-primary" to={`/internships?search=${encodeURIComponent(c.name)}`}>
                View &amp; apply
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

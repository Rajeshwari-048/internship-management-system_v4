import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Companies ranked by how many students they selected
export default function CompanyRanking() {
  const [companies, setCompanies] = useState([]);
  const [by, setBy] = useState('all'); // all | free | paid
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get('/companies/ranking')
      .then((r) => setCompanies(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoaded(true));
  }, []);

  const count = (c) => (by === 'free' ? c.selectedFree : by === 'paid' ? c.selectedPaid : c.selected);

  // Re-rank for the chosen view (same count = same rank)
  const sorted = [...companies].sort(
    (a, b) => count(b) - count(a) || b.applications - a.applications || a.name.localeCompare(b.name)
  );
  let rank = 0;
  const ranked = sorted.map((c, i) => {
    if (i === 0 || count(c) !== count(sorted[i - 1])) rank = i + 1;
    return { ...c, shownRank: rank };
  });
  const max = Math.max(1, ...ranked.map(count));
  const totalSelected = companies.reduce((n, c) => n + c.selected, 0);

  return (
    <div>
      <div className="page-head">
        <h1>Company ranking</h1>
        <select value={by} onChange={(e) => setBy(e.target.value)}>
          <option value="all">Rank by all selected students</option>
          <option value="free">Rank by free internship selections</option>
          <option value="paid">Rank by paid internship selections</option>
        </select>
      </div>
      <p className="muted">
        Companies ranked by how many students they selected. {totalSelected} student(s) selected in
        total across {companies.length} companies.
      </p>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}

      {loaded && ranked.length === 0 ? (
        <p className="muted">No companies yet.</p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Company</th>
                <th>Internships (free / paid)</th>
                <th>Applications</th>
                <th>Selected students</th>
                <th>Free selected</th>
                <th>Paid selected</th>
                <th>Selection rate</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c) => (
                <tr key={c.name}>
                  <td className="rank">{MEDAL[c.shownRank] || `#${c.shownRank}`}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div className="muted small">{[c.industry, c.location].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td>
                    {c.internshipsTotal}{' '}
                    <span className="muted small">({c.freeInternships} free / {c.paidInternships} paid)</span>
                  </td>
                  <td>{c.applications}</td>
                  <td>
                    <div className="bar-wrap">
                      <div className="bar" style={{ width: `${(count(c) / max) * 100}%` }} />
                      <strong>{count(c)}</strong>
                    </div>
                  </td>
                  <td><span className="pill type-free">{c.selectedFree}</span></td>
                  <td><span className="pill type-paid">{c.selectedPaid}</span></td>
                  <td>{c.selectionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

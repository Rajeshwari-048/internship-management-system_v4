import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

// Student: my aptitude test results. Company/admin: results of the applicants.
export default function TestResults() {
  const { user } = useAuth();
  const staff = user.role !== 'student';
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get(staff ? '/tests/results' : '/tests/mine')
      .then((r) => setItems(staff ? r.data : r.data.filter((x) => x.done)))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoaded(true));
  }, [staff]);

  // Normalise both shapes into one row format
  const rows = items.map((x) =>
    staff
      ? {
          id: x._id,
          student: x.student,
          internship: x.internship,
          result: x.testResult,
          stage: x.stage,
        }
      : { id: x.applicationId, internship: x.internship, result: x.result, stage: x.stage }
  );

  return (
    <div>
      <div className="page-head">
        <h1>{staff ? 'Aptitude test results' : 'My test results'}</h1>
      </div>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}
      {notice && <div className="alert alert-success" onClick={() => setNotice('')}>{notice}</div>}

      {loaded && rows.length === 0 ? (
        <p className="muted">
          No test results yet.{' '}
          {!staff && <Link to="/tests">See tests waiting for you</Link>}
        </p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                {staff && <th>Student</th>}
                <th>Internship</th>
                <th>Score</th>
                <th>Percent</th>
                <th>Result</th>
                <th>Company decision</th>
                <th>Taken on</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {staff && (
                    <td>
                      <strong>{r.student?.name}</strong>
                      <div className="muted small">{r.student?.college}</div>
                    </td>
                  )}
                  <td>
                    <strong>{r.internship?.title}</strong>
                    <div className="muted small">{r.internship?.company}</div>
                  </td>
                  <td>{r.result.score} / {r.result.total}</td>
                  <td>{r.result.percent}%</td>
                  <td>
                    <span className={`pill ${r.result.passed ? 'approved' : 'rejected'}`}>
                      {r.result.passed ? 'Passed' : 'Not passed'}
                    </span>
                  </td>
                  <td>
                    <span className={`pill stage-${slug(r.stage)}`}>
                      {r.stage === 'Processing' ? 'Waiting for company' : r.stage}
                    </span>
                  </td>
                  <td>{new Date(r.result.submittedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';

// Student: aptitude tests waiting to be taken (the company selected your resume)
export default function Tests() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get('/tests/mine')
      .then((r) => setItems(r.data.filter((x) => !x.done)))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <div className="page-head">
        <h1>Aptitude tests</h1>
      </div>
      <p className="muted">
        When a company selects your resume, its aptitude test appears here. Finished tests are in{' '}
        <Link to="/results">Test Results</Link>.
      </p>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}

      {loaded && items.length === 0 && (
        <p className="muted">No tests waiting. Apply to internships and wait for the company's reply.</p>
      )}

      <div className="cards-grid">
        {items.map((t) => (
          <div className="card internship" key={t.applicationId}>
            <div className="card-top">
              <h3>{t.internship?.title}</h3>
              <span className="pill stage-aptitude-test">Resume selected</span>
            </div>
            <p className="company">{t.internship?.company}</p>
            {t.test ? (
              <>
                <ul className="meta">
                  <li>📝 {t.test.title}</li>
                  <li>❓ {t.test.questionCount} questions</li>
                  <li>⏱ {t.test.durationMinutes} minutes</li>
                  <li>✅ Pass mark: {t.test.passPercent}%</li>
                </ul>
                <p className="muted small">You can take the test only once. The timer starts when you click Start.</p>
                <div className="row-actions">
                  <Link className="btn btn-primary" to={`/tests/take/${t.applicationId}`}>
                    Start test
                  </Link>
                </div>
              </>
            ) : (
              <p className="muted">The company has not added the test questions yet. Check again later.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

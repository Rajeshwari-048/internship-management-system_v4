import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';

const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

const MESSAGE = {
  Applied: 'Your application was sent. The company has not opened your resume yet.',
  'Under Review': 'The company is reading your resume.',
  'Aptitude Test': 'Your resume is selected! Please take the aptitude test.',
  Processing: 'The company is processing your application (test completed, waiting for the final decision).',
  Selected: 'Congratulations! You are selected for this internship.',
  Rejected: 'Sorry, the company did not select your application this time.',
};

export default function Replies() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get('/applications')
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <div className="page-head">
        <h1>Company replies</h1>
      </div>
      <p className="muted">See what each company replied after viewing your resume.</p>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}

      {loaded && items.length === 0 && (
        <p className="muted">
          You have not applied yet. <Link to="/internships">Browse internships</Link>
        </p>
      )}

      <div className="reports-list">
        {items.map((a) => (
          <div className="card report" key={a._id}>
            <div className="card-top">
              <h3>{a.internship?.title}</h3>
              <span className={`pill stage-${slug(a.stage)}`}>{a.stage}</span>
            </div>
            <p className="muted small">
              {a.internship?.company} · applied on {new Date(a.createdAt).toLocaleDateString()}
            </p>

            <div className={`reply-box reply-${slug(a.stage)}`}>
              <strong>{MESSAGE[a.stage]}</strong>
              {a.adminRemarks && <div>Company message: “{a.adminRemarks}”</div>}
              {a.stage === 'Aptitude Test' && <Link to="/tests">Go to aptitude test →</Link>}
              {a.testResult?.submittedAt && (
                <div>
                  Aptitude result: {a.testResult.score}/{a.testResult.total} ({a.testResult.percent}%) -{' '}
                  {a.testResult.passed ? 'Passed' : 'Not passed'}
                </div>
              )}
            </div>

            <div className="timeline">
              {(a.history || []).map((h, i) => (
                <div className="timeline-item" key={i}>
                  <span className={`dot dot-${slug(h.stage)}`} />
                  <div>
                    <strong>{h.stage}</strong>
                    <span className="muted small"> · {new Date(h.date).toLocaleString()}</span>
                    {h.remarks && <div className="small">{h.remarks}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

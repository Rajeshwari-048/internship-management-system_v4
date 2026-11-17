import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

export default function SelectedStudents() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState(''); // '', 'Free', 'Paid'

  useEffect(() => {
    api
      .get('/applications/selected')
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoaded(true));
  }, []);

  const shown = items.filter((s) => !type || s.internship?.internshipType === type);

  return (
    <div>
      <div className="page-head">
        <h1>Selected students</h1>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Free and paid</option>
          <option value="Free">Free internships</option>
          <option value="Paid">Paid internships</option>
        </select>
      </div>
      <p className="muted">Students who were selected by a company ({shown.length}).</p>
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}

      {loaded && shown.length === 0 ? (
        <p className="muted">No students have been selected yet.</p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>College</th>
                <th>Company</th>
                <th>Internship</th>
                <th>Type</th>
                <th>Selected on</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s, i) => (
                <tr key={s._id}>
                  <td>{i + 1}</td>
                  <td><strong>{s.student?.name}</strong></td>
                  <td>
                    {s.student?.college}
                    <div className="muted small">{s.student?.department}</div>
                  </td>
                  <td>{s.internship?.company}</td>
                  <td>{s.internship?.title}</td>
                  <td>
                    <span className={`pill type-${(s.internship?.internshipType || '').toLowerCase()}`}>
                      {s.internship?.internshipType}
                    </span>
                  </td>
                  <td>{new Date(s.selectedOn).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

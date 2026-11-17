import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Internships from './pages/Internships';
import InternshipForm from './pages/InternshipForm';
import Applications from './pages/Applications';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Companies from './pages/Companies';
import Replies from './pages/Replies';
import SelectedStudents from './pages/SelectedStudents';
import Tests from './pages/Tests';
import TakeTest from './pages/TakeTest';
import TestResults from './pages/TestResults';
import ManageTests from './pages/ManageTests';
import CompanyRanking from './pages/CompanyRanking';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/internships" element={<ProtectedRoute><Internships /></ProtectedRoute>} />
          <Route
            path="/internships/new"
            element={<ProtectedRoute roles={['admin', 'company']}><InternshipForm /></ProtectedRoute>}
          />
          <Route
            path="/internships/:id/edit"
            element={<ProtectedRoute roles={['admin', 'company']}><InternshipForm /></ProtectedRoute>}
          />
          <Route
            path="/companies"
            element={<ProtectedRoute roles={['student', 'admin']}><Companies /></ProtectedRoute>}
          />
          <Route
            path="/replies"
            element={<ProtectedRoute roles={['student']}><Replies /></ProtectedRoute>}
          />
          <Route path="/ranking" element={<ProtectedRoute><CompanyRanking /></ProtectedRoute>} />
          <Route path="/tests" element={<ProtectedRoute roles={['student']}><Tests /></ProtectedRoute>} />
          <Route
            path="/tests/take/:applicationId"
            element={<ProtectedRoute roles={['student']}><TakeTest /></ProtectedRoute>}
          />
          <Route path="/results" element={<ProtectedRoute><TestResults /></ProtectedRoute>} />
          <Route
            path="/manage-tests"
            element={<ProtectedRoute roles={['company', 'admin']}><ManageTests /></ProtectedRoute>}
          />
          <Route path="/selected" element={<ProtectedRoute><SelectedStudents /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route
            path="/profile"
            element={<ProtectedRoute roles={['student', 'company']}><Profile /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

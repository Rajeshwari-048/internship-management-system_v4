# Internship Management System (MERN)

A full-stack web app to manage internships.

- **Frontend:** React.js (Vite) + React Router + Axios
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt, role-based (admin / student)

## Features

**Student**
- Register / login, edit profile (college, department, skills)
- Browse and search open internships (filter by mode)
- Apply with cover letter + resume link, withdraw pending applications
- Track application status and admin remarks
- Submit weekly reports once approved, view admin feedback and rating

**Admin**
- Dashboard with program statistics
- Create, edit, close/reopen and delete internships
- View all applications; approve / reject with remarks
- Review weekly reports with feedback and 1–5 rating

## Folder structure

```
internship-management-system/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/        (User, Internship, Application, Report)
│   ├── routes/        (auth, internships, applications, reports, stats)
│   ├── seed.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── api.js
        ├── context/AuthContext.jsx
        ├── components/    (Navbar, ProtectedRoute)
        ├── pages/         (Login, Register, Dashboard, Internships,
        │                   InternshipForm, Applications, Reports, Profile)
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # on Windows: copy .env.example .env
# edit .env: set MONGO_URI and a strong JWT_SECRET
npm run seed              # creates admin + sample internships
npm run dev               # http://localhost:5000
```

Seeded admin login: `admin@example.com` / `admin123` (change it after first login).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

Open http://localhost:5173. Students can self-register; the admin account comes from the seed script.

## API overview

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | /api/auth/register | public | Register student |
| POST | /api/auth/login | public | Login, returns JWT |
| GET/PUT | /api/auth/me | user | Get / update own profile |
| GET | /api/internships | user | List (students see open only) |
| POST/PUT/DELETE | /api/internships[/:id] | admin | Manage internships |
| POST | /api/applications | student | Apply |
| GET | /api/applications | user | Own (student) or all (admin) |
| PUT | /api/applications/:id/status | admin | Approve / reject |
| DELETE | /api/applications/:id | student | Withdraw pending |
| POST | /api/reports | student | Submit weekly report (approved only) |
| GET | /api/reports | user | Own (student) or all (admin) |
| PUT | /api/reports/:id/review | admin | Feedback + rating |
| GET | /api/stats | user | Dashboard numbers |

## Ideas to extend

- Resume file upload (multer) instead of a link
- Email notifications on approval/rejection (nodemailer)
- Certificate PDF generation on completion
- Pagination and admin user management

## Roles and tabs (latest version)

| Role | Tabs |
|------|------|
| Student | Dashboard (Internship Portal), Companies, Internships (Free / Paid filter), Applied Internships, Company Replies, Aptitude Tests, Test Results, Selected Students, My Reports, Profile |
| Company | Dashboard, My Internships, Applications (view resume, reply with a stage), Aptitude Tests (create test), Test Results, Selected Students, Reports, Company Profile |
| Admin | Dashboard, Companies, Internships, Applications, Selected Students, Reports |

- Free internship = stipend 0, Paid internship = stipend above 0.
- Application stages: Applied -> Under Review -> Aptitude Test -> Processing -> Selected / Rejected.
- Aptitude test flow: the company writes MCQ questions (Aptitude Tests tab), sets an application to "Aptitude Test" (resume selected), the student takes the timed test (Aptitude Tests tab), it is marked automatically, the result shows in Test Results, the application moves to Processing and the company makes the final decision.
- Students apply with a resume upload (PDF/DOC/DOCX) or a link. Resume files are only visible to the student, the company it was sent to, and admins.
- Demo logins after `npm run seed` (inside `backend`): admin@example.com / admin123, company@example.com / company123.

- Company Ranking tab: companies ranked by number of students selected, with free / paid breakdown and selection rate (companies with the same count share a rank). The Companies tab also shows how many students each company selected.

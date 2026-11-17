const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Application = require('../models/Application');
const { STAGES, statusFromStage } = Application;
const ownedInternshipIds = require('../utils/ownedInternships');
const Internship = require('../models/Internship');
const AptitudeTest = require('../models/AptitudeTest');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ---- Resume upload (PDF / DOC / DOCX, max 5 MB) ----
const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) =>
      cb(null, `${req.user._id}-${Date.now()}${ALLOWED[file.mimetype] || '.pdf'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new Error('Resume must be a PDF, DOC or DOCX file')),
});

const removeFile = (file) => {
  if (file) fs.unlink(file, () => {});
};

// POST /api/applications  (student applies, multipart/form-data)
router.post(
  '/',
  protect,
  authorize('student'),
  (req, res, next) =>
    upload.single('resume')(req, res, (err) =>
      err ? res.status(400).json({ message: err.message }) : next()
    ),
  async (req, res) => {
    const uploaded = req.file ? req.file.path : '';
    try {
      const { internshipId, coverLetter, resumeLink } = req.body;
      if (!uploaded && !resumeLink) {
        return res.status(400).json({ message: 'Please upload your resume (PDF/DOC) or give a resume link' });
      }
      const internship = await Internship.findById(internshipId);
      if (!internship) {
        removeFile(uploaded);
        return res.status(404).json({ message: 'Internship not found' });
      }
      if (internship.status !== 'open') {
        removeFile(uploaded);
        return res.status(400).json({ message: 'This internship is closed' });
      }
      if (new Date(internship.deadline) < new Date()) {
        removeFile(uploaded);
        return res.status(400).json({ message: 'Application deadline has passed' });
      }
      const application = await Application.create({
        student: req.user._id,
        internship: internship._id,
        coverLetter,
        resumeLink,
        resumeFile: uploaded,
        resumeOriginalName: req.file ? req.file.originalname : '',
        stage: 'Applied',
        status: 'pending',
        history: [{ stage: 'Applied' }],
      });
      res.status(201).json(application);
    } catch (err) {
      removeFile(uploaded);
      if (err.code === 11000) {
        return res.status(400).json({ message: 'You have already applied to this internship' });
      }
      res.status(400).json({ message: err.message });
    }
  }
);

// GET /api/applications  (student: own, admin: all)
// optional ?status=pending|approved|rejected  &stage=Shortlisted ...
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') filter = { student: req.user._id };
    if (req.user.role === 'company') {
      filter = { internship: { $in: await ownedInternshipIds(req.user._id) } };
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.stage) filter.stage = req.query.stage;
    const applications = await Application.find(filter)
      .populate('student', 'name email college department skills phone')
      .populate('internship', 'title company location mode stipend')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/selected  (names of the students who were selected)
// student/admin: everyone selected, company: only for its own internships
router.get('/selected', protect, async (req, res) => {
  try {
    const filter = { status: 'approved' };
    if (req.user.role === 'company') {
      filter.internship = { $in: await ownedInternshipIds(req.user._id) };
    }
    const selected = await Application.find(filter)
      .populate('student', 'name college department')
      .populate('internship', 'title company internshipType stipend')
      .sort({ updatedAt: -1 });
    res.json(
      selected.map((a) => ({
        _id: a._id,
        student: a.student,
        internship: a.internship,
        selectedOn: a.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Is this user the student, the owning company or an admin of the application?
const canSee = (user, application) =>
  user.role === 'admin' ||
  String(application.student) === String(user._id) ||
  (user.role === 'company' && String(application.internship?.createdBy) === String(user._id));

// GET /api/applications/:id/resume  (student, the company it was sent to, or admin)
router.get('/:id/resume', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('internship', 'createdBy');
    if (!application || !application.resumeFile) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    if (!canSee(req.user, application)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!fs.existsSync(application.resumeFile)) {
      return res.status(404).json({ message: 'Resume file is missing on the server' });
    }
    res.download(application.resumeFile, application.resumeOriginalName || 'resume.pdf');
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/applications/:id/status  (company/admin moves the application to a new stage)
// body: { stage, adminRemarks }  adminRemarks = the reply message shown to the student
router.put('/:id/status', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    let { stage, status, adminRemarks } = req.body;
    if (!stage && status) {
      stage = { approved: 'Selected', rejected: 'Rejected', pending: 'Under Review' }[status];
    }
    if (!STAGES.includes(stage)) {
      return res.status(400).json({ message: `Invalid stage. Use one of: ${STAGES.join(', ')}` });
    }
    const application = await Application.findById(req.params.id).populate('internship', 'createdBy');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (req.user.role === 'company' && !canSee(req.user, application)) {
      return res.status(403).json({ message: 'This application is not for your company' });
    }

    if (stage === 'Aptitude Test') {
      const hasTest = await AptitudeTest.exists({ internship: application.internship._id });
      if (!hasTest) {
        return res.status(400).json({
          message: 'Create the aptitude test for this internship first (Aptitude Tests tab)',
        });
      }
    }

    application.stage = stage;
    application.status = statusFromStage(stage);
    application.adminRemarks = adminRemarks || '';
    application.history.push({ stage, remarks: adminRemarks || '' });
    await application.save();
    res.json(application);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/applications/:id  (student withdraws an application that is still in progress)
router.delete('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, student: req.user._id });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Only applications still in progress can be withdrawn' });
    }
    removeFile(application.resumeFile);
    await application.deleteOne();
    res.json({ message: 'Application withdrawn' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

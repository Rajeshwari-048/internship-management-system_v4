const express = require('express');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const AptitudeTest = require('../models/AptitudeTest');
const { protect, authorize } = require('../middleware/auth');
const ownedInternshipIds = require('../utils/ownedInternships');

const { statusFromStage } = Application;
const router = express.Router();

// The internship if this user (admin, or the company that owns it) may manage its test
const manageable = async (user, internshipId) => {
  const internship = await Internship.findById(internshipId);
  if (!internship) return null;
  if (user.role === 'admin' || String(internship.createdBy) === String(user._id)) return internship;
  return false;
};

// GET /api/tests/internship/:id  (company/admin: the test with its answers)
router.get('/internship/:id', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const internship = await manageable(req.user, req.params.id);
    if (internship === null) return res.status(404).json({ message: 'Internship not found' });
    if (internship === false) return res.status(403).json({ message: 'Not your internship' });
    res.json(await AptitudeTest.findOne({ internship: internship._id }));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/tests/internship/:id  (company/admin creates or replaces the test)
router.put('/internship/:id', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const internship = await manageable(req.user, req.params.id);
    if (internship === null) return res.status(404).json({ message: 'Internship not found' });
    if (internship === false) return res.status(403).json({ message: 'Not your internship' });

    const { title, durationMinutes, passPercent, questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Add at least one question' });
    }
    const clean = [];
    for (const [i, q] of questions.entries()) {
      const options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
      const correctIndex = Number(q.correctIndex);
      if (!q.question || !String(q.question).trim()) {
        return res.status(400).json({ message: `Question ${i + 1} is empty` });
      }
      if (options.length < 2) {
        return res.status(400).json({ message: `Question ${i + 1} needs at least 2 options` });
      }
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        return res.status(400).json({ message: `Question ${i + 1}: choose the correct answer` });
      }
      clean.push({ question: String(q.question).trim(), options, correctIndex });
    }

    const test = await AptitudeTest.findOneAndUpdate(
      { internship: internship._id },
      {
        internship: internship._id,
        createdBy: internship.createdBy,
        title: title || 'Aptitude Test',
        durationMinutes: Number(durationMinutes) || 20,
        passPercent: passPercent === '' || passPercent === undefined ? 50 : Number(passPercent),
        questions: clean,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(test);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/tests/mine  (student: tests to take + finished results)
router.get('/mine', protect, authorize('student'), async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user._id })
      .populate('internship', 'title company')
      .sort({ updatedAt: -1 })
      .lean();
    const relevant = apps.filter((a) => a.stage === 'Aptitude Test' || a.testResult?.submittedAt);
    const tests = await AptitudeTest.find({
      internship: { $in: relevant.map((a) => a.internship?._id) },
    }).lean();
    const byInternship = new Map(tests.map((t) => [String(t.internship), t]));

    res.json(
      relevant.map((a) => {
        const t = byInternship.get(String(a.internship?._id));
        return {
          applicationId: a._id,
          internship: a.internship,
          stage: a.stage,
          done: Boolean(a.testResult?.submittedAt),
          result: a.testResult?.submittedAt ? a.testResult : null,
          test: t
            ? {
                title: t.title,
                durationMinutes: t.durationMinutes,
                passPercent: t.passPercent,
                questionCount: t.questions.length,
              }
            : null,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Loads the application + test if the student may take the test now
const openTest = async (req, res) => {
  const application = await Application.findOne({ _id: req.params.applicationId, student: req.user._id });
  if (!application) {
    res.status(404).json({ message: 'Application not found' });
    return null;
  }
  if (application.testResult?.submittedAt) {
    res.status(400).json({ message: 'You have already taken this test' });
    return null;
  }
  if (application.stage !== 'Aptitude Test') {
    res.status(400).json({ message: 'The aptitude test is not open for this application' });
    return null;
  }
  const test = await AptitudeTest.findOne({ internship: application.internship });
  if (!test) {
    res.status(404).json({ message: 'The company has not added the test questions yet' });
    return null;
  }
  return { application, test };
};

// GET /api/tests/take/:applicationId  (student: questions WITHOUT the answers)
router.get('/take/:applicationId', protect, authorize('student'), async (req, res) => {
  try {
    const found = await openTest(req, res);
    if (!found) return;
    const { application, test } = found;
    res.json({
      applicationId: application._id,
      title: test.title,
      durationMinutes: test.durationMinutes,
      passPercent: test.passPercent,
      questions: test.questions.map((q) => ({ question: q.question, options: q.options })),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/tests/submit/:applicationId  body: { answers: [optionIndex | null, ...] }
router.post('/submit/:applicationId', protect, authorize('student'), async (req, res) => {
  try {
    const found = await openTest(req, res);
    if (!found) return;
    const { application, test } = found;

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const total = test.questions.length;
    const score = test.questions.filter((q, i) => Number(answers[i]) === q.correctIndex).length;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= test.passPercent;

    application.testResult = { score, total, percent, passed, submittedAt: new Date() };
    application.stage = 'Processing';
    application.status = statusFromStage('Processing');
    application.history.push({
      stage: 'Processing',
      remarks: `Aptitude test completed: ${score}/${total} (${percent}%) - ${passed ? 'Passed' : 'Not passed'}`,
    });
    await application.save();
    res.json(application.testResult);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/tests/results  (company: its applicants' results, admin: all)
router.get('/results', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const filter = { 'testResult.submittedAt': { $exists: true } };
    if (req.user.role === 'company') {
      filter.internship = { $in: await ownedInternshipIds(req.user._id) };
    }
    const results = await Application.find(filter)
      .populate('student', 'name email college department')
      .populate('internship', 'title company')
      .sort({ 'testResult.submittedAt': -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

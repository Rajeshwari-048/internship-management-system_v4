const express = require('express');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');
const ownedInternshipIds = require('../utils/ownedInternships');

const { normalizeStage } = Application;

const router = express.Router();

// Count applications per stage
const tally = (apps) => {
  const t = { applied: 0, underReview: 0, aptitude: 0, processing: 0, selected: 0, rejected: 0 };
  for (const a of apps) {
    const stage = normalizeStage(a.stage, a.status);
    if (stage === 'Applied') t.applied += 1;
    else if (stage === 'Under Review') t.underReview += 1;
    else if (stage === 'Aptitude Test') t.aptitude += 1;
    else if (stage === 'Processing') t.processing += 1;
    else if (stage === 'Selected') t.selected += 1;
    else t.rejected += 1;
  }
  return t;
};

// GET /api/stats  (dashboard numbers, shaped by role)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [students, internships, openInternships, applications, pending, approved, rejected, reports] =
        await Promise.all([
          User.countDocuments({ role: 'student' }),
          Internship.countDocuments(),
          Internship.countDocuments({ status: 'open' }),
          Application.countDocuments(),
          Application.countDocuments({ status: 'pending' }),
          Application.countDocuments({ status: 'approved' }),
          Application.countDocuments({ status: 'rejected' }),
          Report.countDocuments(),
        ]);
      return res.json({
        role: 'admin',
        students,
        internships,
        openInternships,
        applications,
        pending,
        approved,
        rejected,
        reports,
      });
    }

    if (req.user.role === 'company') {
      const ids = await ownedInternshipIds(req.user._id);
      const [internships, openInternships, apps, reports] = await Promise.all([
        Internship.countDocuments({ createdBy: req.user._id }),
        Internship.countDocuments({ createdBy: req.user._id, status: 'open' }),
        Application.find({ internship: { $in: ids } }).select('stage status'),
        Report.countDocuments({ internship: { $in: ids } }),
      ]);
      return res.json({
        role: 'company',
        internships,
        openInternships,
        applications: apps.length,
        reports,
        ...tally(apps),
      });
    }

    // student
    const [apps, reports, openInternships, companies, freeInternships, paidInternships] =
      await Promise.all([
        Application.find({ student: req.user._id }).select('stage status'),
        Report.countDocuments({ student: req.user._id }),
        Internship.countDocuments({ status: 'open' }),
        Internship.distinct('company', { status: 'open' }).then((c) => c.length),
        Internship.countDocuments({ status: 'open', stipend: 0 }),
        Internship.countDocuments({ status: 'open', stipend: { $gt: 0 } }),
      ]);
    const t = tally(apps);
    res.json({
      role: 'student',
      applications: apps.length,
      pending: apps.filter((a) => a.status === 'pending').length,
      approved: t.selected,
      rejected: t.rejected,
      reports,
      openInternships,
      companies,
      freeInternships,
      paidInternships,
      ...t,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

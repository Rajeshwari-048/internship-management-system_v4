const express = require('express');
const Report = require('../models/Report');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');
const ownedInternshipIds = require('../utils/ownedInternships');

const router = express.Router();

// POST /api/reports  (student submits a weekly report for an approved internship)
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { internshipId, weekNumber, title, workDone, hoursSpent } = req.body;
    const approved = await Application.findOne({
      student: req.user._id,
      internship: internshipId,
      status: 'approved',
    });
    if (!approved) {
      return res
        .status(403)
        .json({ message: 'You can only submit reports for internships you were approved for' });
    }
    const report = await Report.create({
      student: req.user._id,
      internship: internshipId,
      weekNumber,
      title,
      workDone,
      hoursSpent,
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reports  (student: own, admin: all)
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') filter = { student: req.user._id };
    if (req.user.role === 'company') {
      filter = { internship: { $in: await ownedInternshipIds(req.user._id) } };
    }
    const reports = await Report.find(filter)
      .populate('student', 'name email')
      .populate('internship', 'title company')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/reports/:id/review  (admin gives feedback)
router.put('/:id/review', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    if (req.user.role === 'company') {
      const owned = await ownedInternshipIds(req.user._id);
      const mine = await Report.exists({ _id: req.params.id, internship: { $in: owned } });
      if (!mine) return res.status(403).json({ message: 'This report is not for your company' });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { feedback, rating, status: 'reviewed' },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

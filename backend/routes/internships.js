const express = require('express');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin can manage everything; a company only its own internships
const canManage = (user, internship) =>
  user.role === 'admin' || String(internship.createdBy) === String(user._id);

// GET /api/internships?search=&mode=&status=&type=Free|Paid
router.get('/', protect, async (req, res) => {
  try {
    const { search, mode, status, type } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { company: rx }, { skillsRequired: rx }];
    }
    if (mode) filter.mode = mode;
    if (status) filter.status = status;
    if (type === 'Free') filter.stipend = 0;
    if (type === 'Paid') filter.stipend = { $gt: 0 };
    // Students only see open internships; companies only their own
    if (req.user.role === 'student') filter.status = 'open';
    if (req.user.role === 'company') filter.createdBy = req.user._id;

    const internships = await Internship.find(filter).sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/internships/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });
    res.json(internship);
  } catch (err) {
    res.status(400).json({ message: 'Invalid internship id' });
  }
});

// POST /api/internships  (admin or company)
router.post('/', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (req.user.role === 'company') data.company = req.user.companyName || req.user.name;
    const internship = await Internship.create(data);
    res.status(201).json(internship);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/internships/:id  (admin, or the company that owns it)
router.put('/:id', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const existing = await Internship.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Internship not found' });
    if (!canManage(req.user, existing)) {
      return res.status(403).json({ message: 'You can only edit your own internships' });
    }
    const data = { ...req.body };
    delete data.createdBy;
    if (req.user.role === 'company') delete data.company;
    const internship = await Internship.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    res.json(internship);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/internships/:id  (admin, or the company that owns it)
router.delete('/:id', protect, authorize('admin', 'company'), async (req, res) => {
  try {
    const existing = await Internship.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Internship not found' });
    if (!canManage(req.user, existing)) {
      return res.status(403).json({ message: 'You can only delete your own internships' });
    }
    await existing.deleteOne();
    await Application.deleteMany({ internship: existing._id });
    res.json({ message: 'Internship deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid internship id' });
  }
});

module.exports = router;

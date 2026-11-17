const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  college: user.college,
  department: user.department,
  skills: user.skills,
  companyName: user.companyName,
  industry: user.industry,
  website: user.website,
  location: user.location,
  about: user.about,
});

// POST /api/auth/register  (public registration creates a student or a company)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, college, department, skills, role } = req.body;
    const { companyName, industry, website, location, about } = req.body;
    const isCompany = role === 'company';
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (isCompany && !companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      college,
      department,
      skills: Array.isArray(skills) ? skills : [],
      role: isCompany ? 'company' : 'student',
      ...(isCompany ? { companyName, industry, website, location, about } : {}),
    });
    res.status(201).json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: userPayload(req.user) });
});

// PUT /api/auth/me  (update own profile)
router.put('/me', protect, async (req, res) => {
  try {
    const { name, phone, college, department, skills } = req.body;
    const user = req.user;
    if (user.role === 'company') {
      for (const f of ['companyName', 'industry', 'website', 'location', 'about']) {
        if (req.body[f] !== undefined) user[f] = req.body[f];
      }
    }
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (college !== undefined) user.college = college;
    if (department !== undefined) user.department = department;
    if (Array.isArray(skills)) user.skills = skills;
    await user.save();
    res.json({ user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

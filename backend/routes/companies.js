const express = require('express');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

const router = express.Router();

const keyOf = (name) => name.trim().toLowerCase();

// Per-company numbers: internships posted, applications, students selected (free / paid)
const companyStats = async () => {
  const [internships, apps] = await Promise.all([
    Internship.find().populate('createdBy', 'role industry location website about'),
    Application.find().select('internship status').lean(),
  ]);
  const byInternship = new Map(internships.map((i) => [String(i._id), i]));
  const map = new Map();

  for (const it of internships) {
    const key = keyOf(it.company);
    if (!map.has(key)) {
      const owner = it.createdBy && it.createdBy.role === 'company' ? it.createdBy : null;
      map.set(key, {
        name: it.company,
        industry: owner?.industry || '',
        location: owner?.location || '',
        internshipsTotal: 0,
        openInternships: 0,
        freeInternships: 0,
        paidInternships: 0,
        applications: 0,
        selected: 0,
        selectedFree: 0,
        selectedPaid: 0,
      });
    }
    const c = map.get(key);
    c.internshipsTotal += 1;
    if (it.status === 'open') c.openInternships += 1;
    if (it.stipend > 0) c.paidInternships += 1;
    else c.freeInternships += 1;
  }

  for (const a of apps) {
    const it = byInternship.get(String(a.internship));
    if (!it) continue;
    const c = map.get(keyOf(it.company));
    c.applications += 1;
    if (a.status === 'approved') {
      c.selected += 1;
      if (it.stipend > 0) c.selectedPaid += 1;
      else c.selectedFree += 1;
    }
  }
  return map;
};

// GET /api/companies/ranking  (companies ranked by number of students selected)
router.get('/ranking', protect, async (req, res) => {
  try {
    const list = [...(await companyStats()).values()].map((c) => ({
      ...c,
      selectionRate: c.applications ? Math.round((c.selected / c.applications) * 100) : 0,
    }));
    list.sort(
      (a, b) => b.selected - a.selected || b.applications - a.applications || a.name.localeCompare(b.name)
    );
    // Companies with the same number of selected students share a rank
    let rank = 0;
    list.forEach((c, i) => {
      if (i === 0 || c.selected !== list[i - 1].selected) rank = i + 1;
      c.rank = rank;
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/companies  (companies that currently have open internships, with details)
router.get('/', protect, async (req, res) => {
  try {
    const [internships, stats] = await Promise.all([
      Internship.find({ status: 'open' })
        .populate('createdBy', 'role companyName industry website about location')
        .sort({ createdAt: -1 }),
      companyStats(),
    ]);

    const map = new Map();
    for (const it of internships) {
      const key = keyOf(it.company);
      if (!map.has(key)) {
        const owner = it.createdBy && it.createdBy.role === 'company' ? it.createdBy : null;
        const s = stats.get(key) || {};
        map.set(key, {
          name: it.company,
          industry: owner?.industry || '',
          website: owner?.website || '',
          about: owner?.about || '',
          locations: new Set(),
          free: 0,
          paid: 0,
          applications: s.applications || 0,
          selected: s.selected || 0,
          selectedFree: s.selectedFree || 0,
          selectedPaid: s.selectedPaid || 0,
          internships: [],
        });
      }
      const c = map.get(key);
      if (it.location) c.locations.add(it.location);
      if (it.stipend > 0) c.paid += 1;
      else c.free += 1;
      c.internships.push({
        _id: it._id,
        title: it.title,
        location: it.location,
        mode: it.mode,
        stipend: it.stipend,
        durationMonths: it.durationMonths,
        openings: it.openings,
        deadline: it.deadline,
        internshipType: it.stipend > 0 ? 'Paid' : 'Free',
      });
    }

    const companies = [...map.values()]
      .map((c) => ({ ...c, locations: [...c.locations] }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

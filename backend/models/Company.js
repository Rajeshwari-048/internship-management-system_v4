const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name beku guru!'],
    trim: true,
  },
  industry: {
    type: String,
    enum: ['IT', 'Non-IT'],
    required: true,
    default: 'IT',
  },
  category: {
    type: String,
    trim: true,
    default: 'Software / IT Services',
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  website: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Fresher Details - Neenu kelidhalla guru, idhu adhu guru!
  fresherSalary: {
    type: String,
    default: '₹3.6 LPA',
    trim: true,
  },
  internshipStipend: {
    type: String,
    default: '₹15,000 / month',
    trim: true,
  },
  internshipRoles: {
    type: [String],
    default: ['Software Developer Intern', 'Data Analyst Intern'],
  },
  openPositions: {
    type: Number,
    default: 0,
  },
  logo: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Company', companySchema);
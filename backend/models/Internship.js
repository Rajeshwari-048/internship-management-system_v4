const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, default: 'Remote', trim: true },
    mode: { type: String, enum: ['Remote', 'Onsite', 'Hybrid'], default: 'Remote' },
    stipend: { type: Number, default: 0 },
    durationMonths: { type: Number, default: 3 },
    skillsRequired: [{ type: String, trim: true }],
    openings: { type: Number, default: 1 },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Free = no stipend, Paid = has a stipend
internshipSchema.virtual('internshipType').get(function () {
  return this.stipend > 0 ? 'Paid' : 'Free';
});

module.exports = mongoose.model('Internship', internshipSchema);

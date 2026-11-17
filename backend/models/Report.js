const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    weekNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    workDone: { type: String, required: true },
    hoursSpent: { type: Number, default: 0 },
    status: { type: String, enum: ['submitted', 'reviewed'], default: 'submitted' },
    feedback: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);

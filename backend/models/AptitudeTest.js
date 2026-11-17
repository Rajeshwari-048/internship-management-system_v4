const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], validate: (v) => v.length >= 2 },
    correctIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// One aptitude test per internship, written by the company that posted it
const aptitudeTestSchema = new mongoose.Schema(
  {
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, default: 'Aptitude Test', trim: true },
    durationMinutes: { type: Number, default: 20, min: 1 },
    passPercent: { type: Number, default: 50, min: 0, max: 100 },
    questions: [questionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AptitudeTest', aptitudeTestSchema);

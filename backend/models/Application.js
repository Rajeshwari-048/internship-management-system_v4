const mongoose = require('mongoose');

// The hiring pipeline a company moves each application through
const STAGES = ['Applied', 'Under Review', 'Aptitude Test', 'Processing', 'Selected', 'Rejected'];

// Gives every record a valid stage (old records may only have a status,
// or a stage name from an earlier version)
const normalizeStage = (stage, status) => {
  if (STAGES.includes(stage)) return stage;
  if (stage) return 'Processing';
  return status === 'approved' ? 'Selected' : status === 'rejected' ? 'Rejected' : 'Applied';
};

// Overall status is derived from the stage so dashboard counts keep working
const statusFromStage = (stage) =>
  stage === 'Selected' ? 'approved' : stage === 'Rejected' ? 'rejected' : 'pending';

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    coverLetter: { type: String, default: '' },
    resumeLink: { type: String, default: '' },
    // Uploaded resume file (stored on disk, served only to the owner / admin)
    resumeFile: { type: String, default: '' },
    resumeOriginalName: { type: String, default: '' },
    stage: { type: String, enum: STAGES },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminRemarks: { type: String, default: '' },
    // Filled in when the student finishes the aptitude test
    testResult: {
      score: Number,
      total: Number,
      percent: Number,
      passed: Boolean,
      submittedAt: Date,
    },
    history: [
      {
        stage: String,
        remarks: { type: String, default: '' },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// A student can apply to a given internship only once
applicationSchema.index({ student: 1, internship: 1 }, { unique: true });

// Never expose the server file path; fill stage for older records that lack it
applicationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.resumeFile;
    ret.hasResumeFile = !!doc.resumeFile;
    ret.stage = normalizeStage(ret.stage, ret.status);
    return ret;
  },
});

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STAGES = STAGES;
module.exports.statusFromStage = statusFromStage;
module.exports.normalizeStage = normalizeStage;

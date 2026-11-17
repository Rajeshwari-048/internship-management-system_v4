const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'student', 'company'], default: 'student' },
    phone: { type: String, trim: true },
    college: { type: String, trim: true },
    department: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    // Company profile (only used when role === 'company')
    companyName: { type: String, trim: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    location: { type: String, trim: true },
    about: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);

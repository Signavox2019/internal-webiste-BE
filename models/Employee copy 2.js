const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['CEO', 'HR', 'Manager', 'Developer', 'DevOps', 'BDE', 'Support', 'Other'], default: 'Other' },
  team: { type: String, enum: ['Operations', 'Technical', 'Finance', 'Marketing', 'Other' ], default: 'Other' },
  isAvailable: { type: Boolean, default: true }, 
  bloodGroup: String,
  profileImage: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  otp: String,
  otpExpiry: Date,
  isAdmin: { type: Boolean, default: false }
});

// Hash password before saving
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
employeeSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);

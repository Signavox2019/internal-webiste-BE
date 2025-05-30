const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 🔹 Previous Company Schema
const previousCompanySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: String }, // Optional: e.g., '2 years 4 months'
  reasonForLeaving: { type: String },
  relievingLetterUrl: { type: String },
  location: { type: String },
  technologiesUsed: { type: [String], default: [] }
}, { _id: false });

// 🔹 Previous Project Schema
const previousProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  client: { type: String },
  role: { type: String },
  description: { type: String },
  technologiesUsed: { type: [String], default: [] },
  startDate: { type: Date },
  endDate: { type: Date },
  duration: { type: String },
  projectUrl: { type: String },
  teamSize: { type: Number },
  responsibilities: { type: [String] }
}, { _id: false });

// 🔹 Skill Schema
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  endorsedBy: { type: [String], default: [] } // Optional: names/emails of endorsers
}, { _id: false });

// 🔹 Certification Schema
const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  certificateUrl: { type: String, required: true }
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ['CEO', 'CTO', 'CFO', 'CMO', 'COO', 'CHRO', 'HR', 'Manager', 'Developer', 'DevOps', 'BDE', 'Support', 'UI/UX', 'Testing', 'Other'],
    default: 'Other'
  },
  team: {
    type: String,
    enum: ['Executive', 'Operations', 'Recruitment', 'Technical', 'Finance', 'Marketing', 'Other'],
    default: 'Other'
  },
  isAvailable: { type: Boolean, default: true },
  bloodGroup: String,
  profileImage: String,
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  otp: String,
  otpExpiry: Date,
  isAdmin: { type: Boolean, default: false },

  // 🔽 myMobility fields
  isOnBench: { type: Boolean, default: true },
  isTeamLead: { type: Boolean, default: false },
  currentProject: {
    type: mongoose.Schema.Types.ObjectId,
    // type: Schema.Types.ObjectId,
    ref: 'Project', default: null
  },
  skills: { type: [skillSchema], default: [] },
  experience: { type: String, default: '0 years' },

  // 🔽 Experience section
  previousCompanies: [previousCompanySchema],
  previousProjects: [previousProjectSchema],
  certifications: [certificationSchema]
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
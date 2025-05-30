const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: {
    type: String,
    enum: [
      'Software Development',
      'Quality Assurance',
      'IT Infrastructure and Operations',
      'IT Support',
      'Sales and Marketing',
      'Business Development',
      'Human Resources',
      'Finance',
      'Accounting',
      'Design',
      'Research and Development',
      'IT Security',
      'Others'
    ],
    required: true
  },
  requiredSkills: { type: [String], required: true },
  vacancy: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  teamSizeLimit: { type: Number },
  client: {
    name: { type: String, required: true },
    contactEmail: { type: String },
    mobile: { type: String },            // New field
    ceo: { type: String },               // New field
    industry: { type: String },
    location: { type: String },
    website: { type: String },           // Optional: Company website
    address: { type: String },           // Optional: Full address
    gstNumber: { type: String },         // Optional: For Indian companies
    registrationId: { type: String }     // Optional: Internal reference
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);

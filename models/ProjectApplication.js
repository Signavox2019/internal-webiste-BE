const mongoose = require('mongoose');

const projectApplicationSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'dropped'],
    default: 'pending'
  },
  remarks: { type: String },
  resumeOrPortfolio: { type: String },
  appliedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedReason: { type: String },
  droppedByAdmin: { type: Boolean, default: false },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
});

module.exports = mongoose.model('ProjectApplication', projectApplicationSchema);

// models/Assignment.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'Blank', 'TrueFalse', 'ShortAnswer', 'MAQ'], required: true },
  options: [{ type: String }], // For MCQ or TrueFalse types
  correctAnswer: { type: mongoose.Mixed, required: true }, // Could be string, array, etc.
  marks: { type: Number, default: 1 },
});

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Executive team member
  cutoff: { type: Number, required: true },
//   deadline: { type: Date, required: true },
  questions: [QuestionSchema],
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Users assigned to the assignment
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);

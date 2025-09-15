// models/Attempt.js
const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answer: { type: mongoose.Mixed, required: true }
});

const AttemptSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  answers: [AnswerSchema],
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  attemptNumber: { type: Number, default: 1 },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Attempt', AttemptSchema);

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ticketNumber: { type: String, unique: true },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  image: String,
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  countForwardedFrom: { type: Number, default: 0 },
  forwardedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  countForwardedTo: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Open', 'Resolved', 'Breached'],
    default: 'Open',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
});

module.exports = mongoose.model('Ticket', ticketSchema);

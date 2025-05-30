const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Open', 'Resolved', 'Breached'],
    default: 'Open',
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  assignedTo: {
    type: String, // Email or HR ID; for now use default HR email
    default: 'signavoxtechnologies@gmail.com',
  },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
});

module.exports = mongoose.model('Ticket', ticketSchema);

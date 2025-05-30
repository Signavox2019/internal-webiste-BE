const mongoose = require('mongoose');

const quickLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  link: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuickLink', quickLinkSchema);

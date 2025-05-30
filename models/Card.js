const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['heading', 'paragraph', 'list', 'quote'], // ✅ No image type allowed
    required: true,
  },
  value: mongoose.Schema.Types.Mixed,
});

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: [contentBlockSchema],
  image: String,
  imagePublicId: {
    type: String, // ✅ Used for deleting image from Cloudinary
  },
  type: {
    type: String,
    enum: ['News', 'Leadership', 'HR Policies', 'Insurance Policies', 'Other'],
    default: 'Other',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Card', cardSchema);

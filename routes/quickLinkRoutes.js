const express = require('express');
const router = express.Router();
const { protect, auth } = require('../middleware/auth');

const {
  createQuickLink,
  getAllQuickLinks,
  getMyQuickLinks,
  getQuickLinkById,
  updateQuickLink,
  deleteQuickLink,
  getQuickLinkCount
} = require('../controllers/quickLinkController');

// Routes
router.post('/', protect, createQuickLink);
router.get('/', protect, getAllQuickLinks);
router.get('/my', auth, getMyQuickLinks);
router.get('/count', protect, getQuickLinkCount); // 🔹 New route for count
router.get('/:id', protect, getQuickLinkById);
router.put('/:id', protect, updateQuickLink);
router.delete('/:id', protect, deleteQuickLink);

module.exports = router;

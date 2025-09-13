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
const allowTeams = require('../middleware/allowTeams');

// Routes
router.post('/', protect, allowTeams(['Executive', 'Operations']), createQuickLink);
router.get('/', protect, getAllQuickLinks);
// router.get('/my', auth, getMyQuickLinks);
router.get('/count', protect, allowTeams(['Executive', 'Operations']), getQuickLinkCount); // 🔹 New route for count
router.get('/:id', protect, getQuickLinkById);
router.put('/:id', protect, allowTeams(['Executive', 'Operations']), updateQuickLink);
router.delete('/:id', allowTeams(['Executive', 'Operations']), protect, deleteQuickLink);

module.exports = router;

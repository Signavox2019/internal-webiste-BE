// routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const allowTeams = require('../middleware/allowTeams');
const { protect, auth } = require('../middleware/auth');

// Executive routes
router.post('/', protect, allowTeams(['Executive', 'Operations']), assignmentController.createAssignment);
router.get('/', protect, assignmentController.getAssignments);
router.get('/:id', protect, assignmentController.getAssignment);
router.get('/:id/report',  protect, allowTeams(['Executive', 'Operations']), assignmentController.getAllAttempts);

// User routes
router.get('/available', protect, async (req, res) => {
  const assignments = await require('../models/Assignment').find({
    assignedTo: req.user._id,
    isActive: true
  });
  res.json(assignments);
});
router.post('/:id/attempt', protect, allowTeams(['Executive', 'Operations']), assignmentController.submitAttempt);
router.get('/:id/status', protect, allowTeams(['Executive', 'Operations']), assignmentController.getAttemptHistory);

// Admin routes
router.get('/:id/attempts', protect, allowTeams(['Executive', 'Operations']), assignmentController.getAllAttempts);

module.exports = router;

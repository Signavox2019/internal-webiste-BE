const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const allowTeams = require('../middleware/allowTeams');
const { protect } = require('../middleware/auth');

// Executive & Operations routes
router.post('/', protect, allowTeams(['Executive', 'Operations']), assignmentController.createAssignment);
router.get('/', protect, assignmentController.getAssignments);
router.get('/count', protect, assignmentController.getAssignmentCount);
router.get('/:id', protect, assignmentController.getAssignment);
router.put('/:id', protect, allowTeams(['Executive', 'Operations']), assignmentController.editAssignment);
router.delete('/:id', protect, allowTeams(['Executive', 'Operations']), assignmentController.deleteAssignment);
router.get('/:id/report', protect, allowTeams(['Executive', 'Operations']), assignmentController.getAllAttempts);

// User routes
// router.get('/available', protect, async (req, res) => {
//   const assignments = await require('../models/Assignment').find({
//     assignedTo: req.user._id, // ✅ use req.user instead of req.employee
//     isActive: true
//   });
//   res.json(assignments);
// });
router.post('/:id/attempt', protect, assignmentController.submitAttempt);
router.get('/:id/status', protect, assignmentController.getAttemptHistory);

// Admin or Executive routes to view attempts by all employees
router.get('/:id/attempts', protect, allowTeams(['Executive', 'Operations']), assignmentController.getAllAttempts);

module.exports = router;

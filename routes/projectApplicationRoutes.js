const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectApplicationController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/apply', auth, controller.applyForProject);

router.get('/my-applications', auth, controller.getOwnApplications);

router.delete('/my-applications/:id', auth, controller.deleteOwnApplication);

// Employee applies for project

// Admin gets all applications
router.get('/', auth, adminOnly, controller.getAllApplications);

// Admin get application By Id
router.get('/:id', auth, adminOnly, controller.getApplicationById);
// Admin approves application
router.patch('/approve/:id', auth, adminOnly, controller.approveApplication);

// Admin rejects application
router.patch('/reject/:id', auth, adminOnly, controller.rejectApplication);

// Admin drops employee from project
router.patch('/drop/:id', auth, controller.dropFromProject);



module.exports = router;

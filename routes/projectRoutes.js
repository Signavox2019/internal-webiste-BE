const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth, adminOnly } = require('../middleware/auth');

// CRUD Routes
router.post('/', auth, adminOnly, projectController.createProject);
router.get('/', auth, projectController.getAllProjects);
router.get('/:id', auth, projectController.getProjectById);
router.put('/:id', auth, adminOnly, projectController.updateProject);
router.delete('/:id', auth, adminOnly, projectController.deleteProject);

module.exports = router;

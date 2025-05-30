const express = require('express');
const router = express.Router();
const statsController = require('../controllers/mobilityStatsController');
const { auth, adminOnly } = require('../middleware/auth');

// General mobility statistics
router.get('/overview', auth, adminOnly, statsController.getMobilityStats);

router.get('/application-stats', auth, adminOnly, statsController.getApplicationStats);

// Date-wise application count
router.get('/datewise', auth, adminOnly, statsController.getApplicationsByDate);

module.exports = router;

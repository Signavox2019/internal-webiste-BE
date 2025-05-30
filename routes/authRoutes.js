const express = require('express');
const router = express.Router();
const { registerEmployee, login, sendOTP, resetPassword } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/register', protect, adminOnly, registerEmployee);   // Done
router.post('/login', login);    // Done
router.post('/send-otp', sendOTP);   //Done
router.post('/reset-password', resetPassword);  //

module.exports = router;

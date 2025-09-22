const express = require('express');
const router = express.Router();
const {
  // registerEmployee,
  // loginEmployee,
  logoutEmployee,
  getProfile,
  getProfileById,
  updateProfile,
  getAllEmployees,    // Done
  getEmployeeById,
  deleteEmployee,    // Done
  forgotPassword,
  resetPassword,
  getEmployeeCounts,
  updateProfileImage,
  getSupportEmployees,
  updateEmployeeProfessionalDetails
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // adjust the path if needed



const { protect, adminOnly } = require('../middleware/auth');

// Admin creates/registers new employee
// router.post('/register', registerEmployee);

// // Login and logout
// router.post('/login', loginEmployee);
// router.post('/logout', logoutEmployee);

// Forgot/reset password with OTP
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

router.get('/support', protect, adminOnly, getSupportEmployees);
// Employee profile
router.get('/profile', protect, getProfile);
router.get('/profile/:id', protect, getProfileById);
router.get('/count', protect, authMiddleware, getEmployeeCounts);
router.put('/profile/:id', protect, updateProfile);
router.put('/profile-image', protect, upload.single('image'), updateProfileImage);

// Admin: Manage all employees
// router.get('/support', protect, adminOnly, getSupportEmployees);
// router.get('/', protect, adminOnly, getAllEmployees);
router.get('/', protect, getAllEmployees);
router.get('/:id', protect, adminOnly, getEmployeeById);
router.delete('/:id', protect, adminOnly, deleteEmployee);

// Protected route (use your auth middleware if required)
router.put('/update-professional/:id', protect, updateEmployeeProfessionalDetails);

module.exports = router;

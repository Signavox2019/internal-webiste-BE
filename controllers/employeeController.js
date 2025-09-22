const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');
const s3Client = require('../config/s3'); // AWS S3 client
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const asyncHandler = require('express-async-handler');

// OTP store (in-memory, for production use Redis or DB)
let otpStore = {};

const isValidEmailDomain = (email) => {
  return email.endsWith('@signavoxtechnologies.com');
};

// const getProfile = asyncHandler(async (req, res) => {
//   const employee = req.employee;
//   res.status(200).json(employee);
// });


const getProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  await req.user.populate('currentProject', 'title projectId');

  res.status(200).json({
    success: true,
    data: req.user,
  });
});





const getProfileById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('currentProject', 'title projectId');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc    Update logged-in employee profile
// @route   PUT /api/employees/profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    // console.log(req.body)
    const updated = await Employee.findByIdAndUpdate(req.body._id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update professional details (skills, experience, previous companies/projects, certifications, blood group)
// @route   PUT /api/employees/update-professional/:id
const updateEmployeeProfessionalDetails = asyncHandler(async (req, res) => {
  const {
    skills,
    experience,
    previousCompanies,
    previousProjects,
    certifications,
    bloodGroup
  } = req.body;

  try {
    // Get employee id from token
    const employeeId = req.user._id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update fields if provided
    if (skills) employee.skills = skills;
    if (experience) employee.experience = experience;
    if (previousCompanies) employee.previousCompanies = previousCompanies;
    if (previousProjects) employee.previousProjects = previousProjects;
    if (certifications) employee.certifications = certifications;
    if (bloodGroup) employee.bloodGroup = bloodGroup;

    const updated = await employee.save();

    res.status(200).json({
      message: 'Professional details updated successfully',
      employee: updated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('currentProject', 'title projectId');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all employees (admin only)
// @route   GET /api/employees/
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 }).populate('currentProject', 'title projectId');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete employee (admin only)
// @route   DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get total and role-wise employee count
// @route   GET /api/employees/count
const getEmployeeCounts = async (req, res) => {
  try {
    const total = await Employee.countDocuments();

    const roleCounts = await Employee.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    const teamCounts = await Employee.aggregate([
      {
        $group: {
          _id: '$team',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleCountMap = {};
    const teamCountMap = {};
    roleCounts.forEach((rc) => {
      roleCountMap[rc._id] = rc.count;
    });
    teamCounts.forEach((rc) => {
      teamCountMap[rc._id] = rc.count;
    });

    res.json({
      total,
      roleWise: roleCountMap,
      teamWise: teamCountMap,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update employee profile image (with Multer + Cloudinary)
// @route   PUT /api/employees/profile-image
const updateProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user._id; // ✅ take user id from token
  const file = req.file;

  if (!file || !file.location || !file.key) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  const employee = await Employee.findById(userId);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Delete old profile image from S3 if exists
  if (employee.profileImageKey) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: employee.profileImageKey,
      }));
    } catch (err) {
      console.error('Error deleting old profile image from S3:', err);
    }
  }

  // Update employee profile image with S3 URL + Key
  employee.profileImage = file.location;
  employee.profileImageKey = file.key;
  await employee.save();

  res.status(200).json({
    message: 'Profile image updated successfully',
    profileImage: file.location,
  });
});

// @desc    Get all employees with 'Support' role
// @route   GET /api/employees/support
const getSupportEmployees = asyncHandler(async (req, res) => {
  try {
    const supportEmployees = await Employee.find({ role: 'Support' });
    res.status(200).json(supportEmployees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = {
  updateProfile,
  getProfile,
  getProfileById,
  getAllEmployees,
  getEmployeeById,
  deleteEmployee,
  getEmployeeCounts,
  updateProfileImage,
  getSupportEmployees,
  updateEmployeeProfessionalDetails
};
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');

const asyncHandler = require('express-async-handler');

// OTP store (in-memory, for production use Redis or DB)
let otpStore = {};

const isValidEmailDomain = (email) => {
  return email.endsWith('@signavoxtechnologies.com');
};


// Generate JWT Token
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};



// @desc    Register new employee (admin only)
// @route   POST /api/employees/register
// const registerEmployee = async (req, res) => {
//   const { name, email, password, ...rest } = req.body;

//   try {
//     // Email domain validation
//     if (!email.endsWith('@signavoxtechnologies.com')) {
//       return res.status(400).json({ message: 'Email must end with @signavoxtechnologies.com' });
//     }

//     const existing = await Employee.findOne({ email });
//     if (existing) return res.status(400).json({ message: 'Employee already exists' });

//     const hashedPassword = await bcrypt.hashSync(password, 10); // ✅ Correct hashing

//     const employee = new Employee({
//       name,
//       email,
//       password: hashedPassword, // ✅ Save hashed password
//       ...rest,
//     });

//     await employee.save();

//     res.status(201).json({ message: 'Employee registered successfully' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const registerEmployee = async (req, res) => {
//   const { email, password, ...other } = req.body;

//   // Domain restriction
//   if (!email.endsWith('@signavoxtechnologies.com')) {
//     return res.status(400).json({ message: `Not a valid user` });
//   }

//   // Check if user already exists
//   const existing = await Employee.findOne({ email });
//   if (existing) {
//     return res.status(400).json({ message: 'User already exists' });
//   }

//   const hashed = bcrypt.hashSync(password, 10);
//   const employee = await Employee.create({ ...other, email, password: hashed });

//   // Set token in cookie
//   generateToken(res, employee._id);

//   res.status(201).json({
//     _id: employee._id,
//     email: employee.email,
//     employee,
//   });
// };

// @desc    Login employee
// @route   POST /api/employees/login
// const loginEmployee = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Email domain validation
//     if (!email.endsWith('@signavoxtechnologies.com')) {
//       return res.status(400).json({ message: 'Email must end with @signavoxtechnologies.com' });
//     }

//     const employee = await Employee.findOne({ email });
//     if (!employee) return res.status(400).json({ message: 'Not a valid user' });

//     const isMatch = await bcrypt.compareSync(password, employee.password); // ✅ Compare plain vs hashed

//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     const token = jwt.sign(
//       { id: employee._id, role: employee.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.status(200).json({ message: 'Login successful', token });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const loginEmployee = async (req, res) => {
//   const { email, password } = req.body;

//   // Domain restriction
//   if (!email.endsWith('@signavoxtechnologies.com')) {
//     return res.status(400).json({ message: `Not a valid user` });
//   }

//   const employee = await Employee.findOne({ email });

//   if (employee && bcrypt.compareSync(password, employee.password)) {
//     res.json({ token: generateToken(employee._id), employee });
//   } else {
//     res.status(401).json({ message: "Invalid credentials" });
//   }
// };



// @desc    Logout employee
// @route   POST /api/employees/logout
const logoutEmployee = (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out' });
};

// @desc    Get logged-in employee profile
// @route   GET /api/employees/profile
// const getProfile = async (req, res) => {
//   res.json(req.user);
// };

const getProfile = asyncHandler(async (req, res) => {
  const employee = req.employee;
  res.status(200).json(employee);
});


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


// @desc    Get employee by ID
// @route   GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
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
    const employees = await Employee.find().sort({ createdAt: -1 });
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

// @desc    Forgot password - send OTP
// @route   POST /api/employees/forgot-password
const forgotPassword = async (req, res) => {
  try {
    if (!isValidEmailDomain(email)) {
      return res.status(400).json({ message: 'Email must end with @signavoxtechnologies.com' });
    }

    const { email } = req.body;
    const employee = await Employee.findOne({ email });

    if (!employee) return res.status(404).json({ message: 'No employee with that email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

    await sendMail(email, 'Signavox Password Reset OTP', `Your OTP is ${otp}`);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/employees/reset-password
const resetPassword = async (req, res) => {
  try {
    if (!isValidEmailDomain(email)) {
      return res.status(400).json({ message: 'Email must end with @signavoxtechnologies.com' });
    }

    const { email, otp, newPassword } = req.body;
    const record = otpStore[email];

    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await Employee.findOneAndUpdate({ email }, { password: hashed });

    delete otpStore[email];
    res.json({ message: 'Password reset successful' });
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

    const roleCountMap = {};
    roleCounts.forEach((rc) => {
      roleCountMap[rc._id] = rc.count;
    });

    res.json({
      total,
      roleWise: roleCountMap,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc    Update employee profile image (with Multer + Cloudinary)
// @route   PUT /api/employees/profile-image
const updateProfileImage = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  const employee = await Employee.findById(_id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Upload to Cloudinary
  const cloudinary = require('../utils/cloudinary'); // adjust if your path is different
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'signavox/employees', // optional folder in Cloudinary
    resource_type: 'image',
  });

  // Update profileImage field
  employee.profileImage = result.secure_url;
  await employee.save();

  res.status(200).json({ message: 'Profile image updated successfully', profileImage: result.secure_url });
});




module.exports = {
  // registerEmployee,
  // loginEmployee,
  logoutEmployee,
  updateProfile,
  getProfile,
  getAllEmployees,
  getEmployeeById,
  deleteEmployee,
  forgotPassword,
  resetPassword,
  getEmployeeCounts,
  updateProfileImage
};
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const transporter = require('../config/nodemailer');
const generateOTP = require('../utils/generateOTP');
const bcrypt = require('bcrypt');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const isValidSignavoxEmail = (email) => email.endsWith("@signavoxtechnologies.com");


exports.registerEmployee = async (req, res) => {
  try {
    const { name, email, password, employeeId, role, team, bloodGroup, profileImage } = req.body;

    if (!isValidSignavoxEmail(email)) {
      return res.status(400).json({ message: "Only @signavoxtechnologies.com emails are allowed" });
    }

    const isAdmin = ['CEO', 'HR', 'CFO', 'CTO', 'COO', 'CMO'].includes(role);
    const employee = await Employee.create({ name, email, password, employeeId, role, team, bloodGroup, profileImage, isAdmin });

    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email });
  if (!employee || !(await employee.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Check if the employee status is Inactive
  if (employee.status === 'Inactive') {
    return res.status(403).json({ message: "Your account is currently inactive. Please contact admin." });
  }


  const token = generateToken(employee._id);
  res.json({ token, employee });
};

exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  const employee = await Employee.findOne({ email });
  if (!employee) return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  employee.otp = otp;
  employee.otpExpiry = expiry;
  await employee.save();

  await transporter.sendMail({
    to: email,
    subject: "OTP for Password Reset",
    html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`
  });

  res.json({ message: "OTP sent to email" });
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(400).json({ message: "Invalid or expired OTP" });

    if (employee.otp !== otp || employee.otpExpiry < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    employee.password = newPassword; // Let the model hash it
    employee.otp = undefined;
    employee.otpExpiry = undefined;
    await employee.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

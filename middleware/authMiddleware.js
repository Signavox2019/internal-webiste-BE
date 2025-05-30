const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee'); // Adjust path as needed

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findById(decoded.id).select("-password"); // exclude password

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    req.user = employee;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;

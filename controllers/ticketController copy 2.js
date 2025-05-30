const Ticket = require("../models/Ticket");
const User = require("../models/Employee");
const asyncHandler = require("express-async-handler");
const { sendMail } = require("../utils/sendMail");
const path = require("path");
const fs = require("fs");





// Utility: Check if a date is a working day (Mon–Fri)
const isWorkingDay = (date) => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

// Utility: Get next working day
const getNextWorkingDay = (date) => {
  const result = new Date(date);
  while (!isWorkingDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
};

// Utility: Get working hours between two dates
const getWorkingHoursBetween = (start, end) => {
  let hours = 0;
  const current = new Date(start);
  while (current < end) {
    if (isWorkingDay(current)) {
      hours++;
    }
    current.setHours(current.getHours() + 1);
  }
  return hours;
};

const now = new Date(); // <== This was missing


// Format date as DDMMYYYY
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
const year = now.getFullYear();
const formattedDate = `${day}${month}${year}`;

// Create Ticket
// const createTicket = asyncHandler(async (req, res) => {
//   const { title, description, createdBy } = req.body;
//   const image = req.file ? req.file.filename : null;

//   const employee = await User.findById(createdBy);
//   if (!employee) throw new Error("Employee not found");

//   const ticketCount = await Ticket.countDocuments();
//   // const ticketNumber = `IE${Date.now()}${ticketCount + 1}`;
//   // console.log(Date.now())
//   const ticketNumber = `IE${formattedDate}${ticketCount + 1}`;

//   const assignedSupport = await assignSupportEmployee();
//   if (!assignedSupport) throw new Error("No support member available");

//   const ticket = await Ticket.create({
//     title,
//     description,
//     createdBy,
//     assignedTo: assignedSupport._id,
//     ticketNumber,
//     image,
//     status: "Open",
//     createdAt: new Date(),
//   });

//   res.status(201).json(ticket);
// });
// Create Ticket
// const createTicket = asyncHandler(async (req, res) => {
//   const { title, description, createdBy } = req.body;
//   const image = req.file ? req.file.filename : null;

//   const employee = await User.findById(createdBy);
//   if (!employee) throw new Error("Employee not found");

//   const todayStart = new Date();
//   todayStart.setHours(0, 0, 0, 0);

//   const todayEnd = new Date();
//   todayEnd.setHours(23, 59, 59, 999);

//   const todayTicketCount = await Ticket.countDocuments({
//     createdAt: { $gte: todayStart, $lte: todayEnd }
//   });

//   const ticketNumber = `IE${formattedDate}${todayTicketCount + 1}`;

//   const assignedSupport = await assignSupportEmployee();
//   if (!assignedSupport) throw new Error("No support member available");

//   const ticket = await Ticket.create({
//     title,
//     description,
//     createdBy,
//     assignedTo: assignedSupport._id,
//     ticketNumber,
//     image,
//     status: "Open",
//     createdAt: new Date(),
//   });

//   res.status(201).json(ticket);
// });

const createTicket = asyncHandler(async (req, res) => {
  const { title, description, createdBy } = req.body;
  const image = req.file ? req.file.filename : null;

  const employee = await User.findById(createdBy);
  if (!employee) throw new Error("Employee not found");

  // Ticket prefix
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayTicketCount = await Ticket.countDocuments({
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  const randomString = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 2; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  };

  let ticketNumber;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 5) {
    ticketNumber = `IE${formattedDate}${randomString()}${todayTicketCount + 1}`;
    const existingTicket = await Ticket.findOne({ ticketNumber });
    if (!existingTicket) exists = false;
    attempts++;
  }

  if (exists) throw new Error("Failed to generate unique ticket number");

  const assignedSupport = await assignSupportEmployee();
  if (!assignedSupport) throw new Error("No support member available");

  const ticket = await Ticket.create({
    title,
    description,
    createdBy,
    assignedTo: assignedSupport._id,
    ticketNumber,
    image,
    status: "Open",
    createdAt: new Date(),
  });

  res.status(201).json(ticket);
});





// Assign support employee round-robin
let lastAssignedIndex = 0;
const assignSupportEmployee = async () => {
  // Case-insensitive match to avoid casing issues in the DB
  const supportTeam = await User.find({ role: /Support/i, status: "Active" });

  console.log("Available Support Members:", supportTeam.map(u => u.name)); // Debug log

  if (!supportTeam.length) return null;

  const assigned = supportTeam[lastAssignedIndex % supportTeam.length];
  lastAssignedIndex++;
  return assigned;
};

// Get All Tickets
const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find().populate("createdBy assignedTo handledBy forwardedFrom forwardedTo");
  res.json(tickets);
});

// Get Ticket by ID
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate("createdBy assignedTo handledBy forwardedFrom forwardedTo");
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  res.json(ticket);
});

// Update Ticket
const updateTicket = asyncHandler(async (req, res) => {
  const { title, description, status } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  ticket.title = title || ticket.title;
  ticket.description = description || ticket.description;
  if (status) ticket.status = status;

  if (req.file) {
    const image = req.file.filename;
    ticket.image = image;
  }

  await ticket.save();
  res.json(ticket);
});

// Delete Ticket
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  // Delete associated image if it exists
  if (ticket.image) {
    const imagePath = path.join(__dirname, `../uploads/${ticket.image}`);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  await Ticket.findByIdAndDelete(req.params.id);

  res.json({ message: "Ticket deleted" });
});


// Forward Ticket
const forwardTicket = asyncHandler(async (req, res) => {
  const { forwardedTo } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new Error("Ticket not found");

  const targetUser = await User.findById(forwardedTo);
  if (!targetUser || !/support/i.test(targetUser.role)) throw new Error("Invalid forwarding target");

  ticket.forwardedFrom = ticket.assignedTo;
  ticket.forwardedTo = forwardedTo;
  ticket.assignedTo = forwardedTo;
  await ticket.save();

  res.json({ message: "Ticket forwarded successfully", ticket });
});

// Ticket Stats
const getTicketStats = asyncHandler(async (req, res) => {
  const total = await Ticket.countDocuments();
  const open = await Ticket.countDocuments({ status: "Open" });
  const resolved = await Ticket.countDocuments({ status: "Resolved" });
  const breached = await Ticket.countDocuments({ status: "Breached" });

  res.json({ total, open, resolved, breached });
});

// Breach Check Job (run every hour with cron)
const checkBreachedTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ status: "Open" });
  const breachedTickets = [];

  for (let ticket of tickets) {
    const workingHours = getWorkingHoursBetween(ticket.createdAt, new Date());
    if (workingHours >= 24) {
      ticket.status = "Breached";
      await ticket.save();

      const creator = await User.findById(ticket.createdBy);
      const admin = await User.findOne({ role: "CEO" }); // or use multiple admins

      const subject = `🚨 Ticket ${ticket.ticketNumber} Breached`;
      const message = `The ticket titled "${ticket.title}" has breached the 24-hour SLA. Please take immediate action.`;

      await sendMail(creator.email, subject, message);
      if (admin) await sendMail(admin.email, subject, message);

      breachedTickets.push(ticket.ticketNumber);
    }
  }

  res.json({ breached: breachedTickets });
});


// @desc    Support member updates the status of a ticket
// @route   PATCH /api/tickets/:id/status
// @access  Support
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, handledBy } = req.body;

  if (!['Open', 'Resolved', 'Breached'].includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  ticket.status = status;
  if (status === 'Resolved') {
    ticket.resolvedAt = new Date();
    ticket.handledBy = handledBy;
  }

  await ticket.save();

  res.json({ message: "Ticket status updated successfully", ticket });
});


// @desc    Get tickets created by a specific employee (self)
// @route   GET /api/tickets/my-tickets/:employeeId
// @access  Employee
const getMyTickets = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Fetch all tickets created by this user
  const tickets = await Ticket.find({ createdBy: employeeId })
    .populate("assignedTo handledBy forwardedFrom forwardedTo")
    .sort({ createdAt: -1 });

  // Calculate status counts
  const openCount = tickets.filter(ticket => ticket.status === 'Open').length;
  const resolvedCount = tickets.filter(ticket => ticket.status === 'Resolved').length;
  const breachedCount = tickets.filter(ticket => ticket.status === 'Breached').length;

  res.json({
    total: tickets.length,
    open: openCount,
    resolved: resolvedCount,
    breached: breachedCount,
    tickets
  });
});


// @desc    Get ticket stats for a non-admin employee (self)
// @route   GET /api/tickets/my-ticket-stats/:employeeId
// @access  Private (Non-admin)
const getMyTicketStats = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Ensure employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }

  // Count tickets created by this employee
  const total = await Ticket.countDocuments({ createdBy: employeeId });
  const open = await Ticket.countDocuments({ createdBy: employeeId, status: "Open" });
  const resolved = await Ticket.countDocuments({ createdBy: employeeId, status: "Resolved" });
  const breached = await Ticket.countDocuments({ createdBy: employeeId, status: "Breached" });

  res.json({ total, open, resolved, breached });
});




module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  forwardTicket,
  getTicketStats,
  checkBreachedTickets,
  updateTicketStatus,
  getMyTickets,
  getMyTicketStats,
};

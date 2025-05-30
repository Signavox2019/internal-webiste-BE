const Ticket = require("../models/Ticket");
const User = require("../models/Employee");
const asyncHandler = require("express-async-handler");
const { sendMail } = require("../utils/sendMail");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../utils/cloudinary")
const moment = require("moment");


// const multer = require("multer");
// const cloudinary = require("cloudinary").v2;
// const fs = require("fs");

// // Cloudinary config (ensure this is set correctly in your project)
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Multer setup (temporary local storage)
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   },
// });
// const upload = multer({ storage });


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

const generateRandomChars = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return chars.charAt(Math.floor(Math.random() * 26)) + chars.charAt(Math.floor(Math.random() * 26));
};

// Utility: Generate Unique Ticket Number
const generateTicketNumber = async () => {
  const today = formattedDate;
  const todayCount = await Ticket.countDocuments({
    ticketNumber: { $regex: `^IE${today}` },
  });
  return `IE${today}${(todayCount + 1).toString().padStart(3, "0")}`;
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

// const createTicket = async (req, res) => {
//   try {
//     const { title, description } = req.body;
//     const image = req.file ? req.file.filename : null;

//     // Get support team
//     const supportTeam = await Employee.find({ role: 'Support', status: 'Active' });

//     if (!supportTeam.length) {
//       return res.status(400).json({ error: 'No active support team members found.' });
//     }

//     // Assign via round-robin
//     const assignedTo = supportTeam[lastAssignedIndex % supportTeam.length];
//     lastAssignedIndex++;

//     // Generate ticket number
//     const ticketNumber = await generateTicketNumber();

//     const ticketData = {
//       title,
//       description,
//       createdBy: req.user._id,
//       ticketNumber,
//       assignedTo: assignedTo._id,
//     };

//     // If image uploaded
//     if (req.file && req.file.path) {
//       ticketData.image = req.file.path;
//     }

//     const ticket = new Ticket(ticketData);
//     await ticket.save();

//     res.status(201).json(ticket);
//   } catch (err) {
//     console.error('Error creating ticket:', err);
//     res.status(500).json({ error: 'Failed to create ticket' });
//   }
// };




// Assign support employee round-robin


// const createTicket = async (req, res) => {
//   upload(req, res, async function (err) {
//     if (err) {
//       console.error("Multer error:", err);
//       return res.status(400).json({ error: err.message });
//     }

//     try {
//       const { title, description } = req.body;

//       // Get support team
//       const supportTeam = await User.find({ role: 'Support', status: 'Active' });
//       if (!supportTeam.length) {
//         return res.status(400).json({ error: 'No active support team members found.' });
//       }

//       // Assign via round-robin
//       const assignedTo = supportTeam[lastAssignedIndex % supportTeam.length];
//       lastAssignedIndex++;

//       // Generate ticket number
//       const ticketNumber = await generateTicketNumber();

//       const ticketData = {
//         title,
//         description,
//         createdBy: req.user._id,
//         ticketNumber,
//         assignedTo: assignedTo._id,
//       };

//       // Upload image to Cloudinary if exists
//       if (req.file && req.file.path) {
//         const result = await cloudinary.uploader.upload(req.file.path, {
//           folder: "tickets",
//         });
//         ticketData.image = result.secure_url;

//         // Optionally remove local file after upload
//         fs.unlinkSync(req.file.path);
//       }

//       const ticket = new Ticket(ticketData);
//       await ticket.save();

//       res.status(201).json(ticket);
//     } catch (err) {
//       console.error("Error creating ticket:", err);
//       res.status(500).json({ error: "Failed to create ticket" });
//     }
//   });
// };


// Controller: Create Ticket and Upload to Cloudinary


// const createTicket = async (req, res) => {
//   try {
//     const { title, description, createdBy } = req.body;
//     let imageUrl = "";

//     // Upload image to Cloudinary
//     if (req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "signavox-tickets",
//       });
//       imageUrl = result.secure_url;

//       // Delete local copy after upload
//       fs.unlinkSync(req.file.path);
//     }

//     const ticket = new Ticket({
//       title,
//       description,
//       createdBy,
//       image: imageUrl, // Set Cloudinary URL here
//     });

//     await ticket.save();

//     res.status(201).json({ success: true, ticket });
//   } catch (err) {
//     console.error("Cloudinary Upload Error:", err);
//     res.status(500).json({ success: false, message: "Ticket creation failed" });
//   }
// };


// Global support assignment counter
let supportCounter = 0;

const createTicket = async (req, res) => {
  try {
    const { title, description, createdBy } = req.body;

    if (!title || !description || !createdBy) {
      return res.status(400).json({ success: false, message: "Title, description, and createdBy are required" });
    }

    // Upload image to Cloudinary if available
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "signavox-tickets",
      });
      imageUrl = result.secure_url;
    }

    // Get support team members
    const supportMembers = await User.find({ role: "Support" });
    if (supportMembers.length === 0) {
      return res.status(500).json({ success: false, message: "No support team members found" });
    }

    // Round-robin assignment
    const assignedEmployee = supportMembers[supportCounter % supportMembers.length];
    supportCounter++;

    // Format ticket number: IE + ddMMyyyy + 2 random letters + 3-digit count
    const today = moment().format("DDMMYYYY");
    const randomChars = generateRandomChars();
    const ticketCountToday = await Ticket.countDocuments({
      createdAt: {
        $gte: moment().startOf("day").toDate(),
        $lte: moment().endOf("day").toDate(),
      },
    });

    const ticketNumber = `IE${today}${randomChars}${(ticketCountToday + 1).toString().padStart(3, "0")}`;

    // Create the ticket
    const createdTicket = await Ticket.create({
      title,
      description,
      image: imageUrl,
      createdBy,
      assignedTo: assignedEmployee._id,
      ticketNumber,
    });

    // Populate both assignedTo and createdBy
    const populatedTicket = await Ticket.findById(createdTicket._id)
      .populate("createdBy")
      .populate("assignedTo");

    res.status(201).json({
      success: true,
      ticket: populatedTicket,
    });

  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


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
// const updateTicket = asyncHandler(async (req, res) => {
//   const { title, description, status } = req.body;
//   const ticket = await Ticket.findById(req.params.id);
//   if (!ticket) {
//     res.status(404);
//     throw new Error("Ticket not found");
//   }

//   ticket.title = title || ticket.title;
//   ticket.description = description || ticket.description;
//   if (status) ticket.status = status;

//   if (req.file) {
//     const image = req.file.filename;
//     ticket.image = image;
//   }

//   await ticket.save();
//   res.json(ticket);
// });

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

  // Handle image update
  if (req.file) {
    try {
      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "tickets",
      });

      // Update ticket with Cloudinary image URL
      ticket.image = result.secure_url;
    } catch (error) {
      res.status(500);
      throw new Error("Cloudinary upload failed");
    }
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

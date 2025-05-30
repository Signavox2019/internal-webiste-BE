// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload")
const {
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
} = require("../controllers/ticketController");


// Get ticket statistics
router.get("/stats", getTicketStats);

// Create Ticket with image upload
router.post("/", upload.single("image"), createTicket);

// Get all tickets
router.get("/", getAllTickets);

// Get ticket by ID
router.get("/:id", getTicketById);

// Update ticket by ID (optional image upload)
router.put("/:id", upload.single("image"), updateTicket);

// Delete ticket by ID
router.delete("/:id", deleteTicket);

// Forward ticket by ID
router.post("/forward/:id", forwardTicket);


// Check breached tickets (could be a cron job endpoint or protected route)
router.get("/check-breached", checkBreachedTickets);

// ✅ New status update route
router.patch('/:id/status', updateTicketStatus);

router.get("/my-tickets/:employeeId", getMyTickets);

// Get ticket stats for logged-in (non-admin) employee
router.get("/my-ticket-stats/:employeeId", getMyTicketStats);

module.exports = router;

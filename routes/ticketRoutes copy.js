const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTicket,
  getTickets,
  updateTicketStatus,
  deleteTicket,
  getYearlyTicketStats,
  getTicketStatusCounts,
  getTicketById
} = require('../controllers/ticketController');

router.post('/', protect, createTicket);
router.get('/', protect, getTickets);
router.get('/:id', protect, getTicketById);
router.put('/:id', protect, updateTicketStatus);
router.delete('/:id', protect, deleteTicket);
router.get('/ticket-stats/yearly', getYearlyTicketStats);
router.get('/ticket-stats/by-status', getTicketStatusCounts);

module.exports = router;

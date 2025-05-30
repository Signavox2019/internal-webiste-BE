const Ticket = require('../models/Ticket');
const sendMail = require('../utils/sendMail');

// Create Ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      raisedBy: req.employee._id,
    });

    // Send mail to HR
    await sendMail({
      to: 'signavoxtechnologies@gmail.com',
      subject: `New Ticket Raised: ${title}`,
      text: `A new ticket has been raised by ${req.employee.name} (${req.employee.email}):\n\n${description}`,
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all tickets (admin) or self tickets
exports.getTickets = async (req, res) => {
  const query = req.employee.role === 'CEO' || req.employee.role === 'HR'
    ? {}
    : { raisedBy: req.employee._id };

  const tickets = await Ticket.find(query).populate('raisedBy', 'name email');
  res.json(tickets);
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  const { status, title, description } = req.body;

  const ticket = await Ticket.findById(req.params.id).populate('raisedBy');

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  ticket.status = status;
  ticket.title = title;
  ticket.description = description;

  if (status === 'Resolved') ticket.resolvedAt = new Date();
  await ticket.save();

  // Notify employee if resolved
  if (status === 'Resolved') {
    await sendMail({
      to: ticket.raisedBy.email,
      subject: `Ticket Resolved: ${ticket.title}`,
      text: `Hi ${ticket.raisedBy.name},\n\nYour ticket "${ticket.title}" has been resolved.`,
    });
  }

  res.json(ticket);
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ message: 'Ticket deleted' });
};

// Get ticket creation stats per month/year
exports.getYearlyTicketStats = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedStats = stats.map(item => ({
      year: item._id.year,
      month: item._id.month,
      count: item.count
    }));

    res.json({ success: true, data: formattedStats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket stats',
      error: error.message
    });
  }
};

// Get ticket status counts
exports.getTicketStatusCounts = async (req, res) => {
  try {
    const statusCounts = await Ticket.aggregate([
      {
        $match: {
          status: { $in: ['Open', 'Resolved', 'Breached'] }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedCounts = {
      Open: 0,
      Resolved: 0,
      Breached: 0,
    };

    statusCounts.forEach(item => {
      formattedCounts[item._id] = item.count;
    });

    res.json({
      success: true,
      data: formattedCounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket status counts',
      error: error.message,
    });
  }
};



// Get a single ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('raisedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Allow access only to the creator or admins (CEO/HR)
    if (
      ticket.raisedBy._id.toString() !== req.employee._id.toString() &&
      !['CEO', 'HR'].includes(req.employee.role)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
};

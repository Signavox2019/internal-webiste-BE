const cron = require('node-cron');
const Ticket = require('../models/Ticket');

cron.schedule('0 * * * *', async () => {
  const tickets = await Ticket.find({ status: 'Open' });

  const now = Date.now();

  for (const ticket of tickets) {
    const diff = now - new Date(ticket.createdAt).getTime();
    if (diff > 24 * 60 * 60 * 1000) {
      ticket.status = 'Breached';
      await ticket.save();
    }
  }

  console.log('[TicketChecker] Breach status updated');
});

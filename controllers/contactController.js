// controllers/contactController.js
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  
});
// console.log(process.env.EMAIL_USER)
// console.log(process.env.EMAIL_PASS)

// 🎨 Fancy HTML Mail Template
const generateHTML = ({ name, email, message }) => `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #311188 0%, #0A081E 100%); color: white; padding: 20px;">
      <h2>📬 New Contact Message from ${name}</h2>
    </div>
    <div style="padding: 20px;">
      <p><strong>👤 Name:</strong> ${name}</p>
      <p><strong>📧 Email:</strong> ${email}</p>
      <p><strong>📝 Message:</strong><br>${message}</p>
      <p style="font-size: 12px; color: gray;">Submitted on: ${new Date().toLocaleString()}</p>
    </div>
  </div>
`;

// 📩 Submit Contact Form and Send Email
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const contact = await Contact.create({ name, email, message });

    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: process.env.EMAIL_USER,
    //   subject: `New Contact Form Submission from ${name}`,
    //   html: generateHTML({ name, email, message }),
    // };

    // await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Message sent and saved successfully.', contact });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form.' });
  }
};

// Get All Contacts
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
};

// Get Contact by ID
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact.' });
  }
};

// Update Contact by ID
exports.updateContact = async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Contact not found.' });
    res.status(200).json({ message: 'Contact updated.', contact: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact.' });
  }
};

// Delete Contact by ID
exports.deleteContact = async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Contact not found.' });
    res.status(200).json({ message: 'Contact deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
};

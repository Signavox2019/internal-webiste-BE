// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');

// Contact Routes
router.post('/', submitContactForm);
router.get('/', getAllContacts);
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

module.exports = router;

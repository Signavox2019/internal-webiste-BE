const QuickLink = require('../models/QuickLink');

exports.createQuickLink = async (req, res) => {
  try {
    const { title, content, link } = req.body || {};

    // Validate required fields
    if (!title || !link) {
      return res.status(400).json({ message: 'Title and link are required' });
    }

    const quickLink = await QuickLink.create({
      title,
      content,
      link,
      createdBy: req.employee._id,
    });

    return res.status(201).json(quickLink); // ✅ return here
  } catch (err) {
    console.error('Error creating quick link:', err);
    if (!res.headersSent) {
      return res.status(400).json({ message: err.message }); // ✅ return here
    }
    // If headers already sent, you might log it or call next(err)
  }
};


exports.getAllQuickLinks = async (req, res) => {
  try {
    const links = await QuickLink.find().populate('createdBy', 'name email');
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getMyQuickLinks = async (req, res) => {
  try {
    const quickLinks = await QuickLink.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json(quickLinks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getQuickLinkById = async (req, res) => {
  try {
    const link = await QuickLink.findById(req.params.id).populate('createdBy', 'name email');
    if (!link) return res.status(404).json({ message: 'Quick Link not found' });
    res.json(link);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateQuickLink = async (req, res) => {
  try {
    const { title, content, link } = req.body;

    const updated = await QuickLink.findByIdAndUpdate(
      req.params.id,
      { title, content, link },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Quick Link not found' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteQuickLink = async (req, res) => {
  try {
    const link = await QuickLink.findByIdAndDelete(req.params.id);
    if (!link) return res.status(404).json({ message: 'Quick Link not found' });
    res.json({ message: 'Quick Link deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get total count of QuickLinks
exports.getQuickLinkCount = async (req, res) => {
  try {
    const count = await QuickLink.countDocuments();
    res.json({ totalQuickLinks: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

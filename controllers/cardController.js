const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const Card = require('../models/Card');
const upload = require('../middleware/upload');

// // const { upload } = require('../middleware/upload');
// const { upload } = require('');


// Cloudinary config
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Multer storage config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './uploads');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|gif/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Only image files are allowed'));
//   },
// }).single('image');

// Create Card
// exports.createCard = (req, res) => {
//   upload(req, res, (err) => {
//     if (err) {
//       return res.status(400).json({ message: err.message });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: 'No image file provided' });
//     }

//     cloudinary.uploader.upload(req.file.path, { folder: 'cards' }, (err, result) => {
//       if (err) {
//         return res.status(500).json({ message: 'Error uploading image to Cloudinary', error: err });
//       }

//       // Parse and filter description (remove image type)
//       let filteredDescription = [];
//       try {
//         const parsed = JSON.parse(req.body.description);
//         filteredDescription = parsed.filter((block) =>
//           ['heading', 'paragraph', 'list', 'quote'].includes(block.type)
//         );
//       } catch (parseErr) {
//         return res.status(400).json({ message: 'Invalid description format', error: parseErr });
//       }

//       const newCard = new Card({
//         title: req.body.title,
//         description: filteredDescription,
//         image: result.secure_url,
//         imagePublicId: result.public_id,
//         type: req.body.type,
//         createdBy: req.user?.id, // Optional: add user from auth middleware
//       });

//       newCard.save()
//         .then((card) => res.status(201).json({ message: 'Card created successfully', card }))
//         .catch((error) => res.status(500).json({ message: 'Error saving card to database', error }));
//     });
//   });
// };

exports.createCard = async (req, res) => {
  try {
    if (!req.file || !req.file.path || !req.file.filename) {
      return res.status(400).json({ message: 'Image upload failed or no image provided' });
    }

    // Parse and filter description
    let filteredDescription = [];
    try {
      const parsed = JSON.parse(req.body.description);
      filteredDescription = parsed.filter((block) =>
        ['heading', 'paragraph', 'list', 'quote'].includes(block.type)
      );
    } catch (parseErr) {
      return res.status(400).json({ message: 'Invalid description format', error: parseErr });
    }

    const newCard = new Card({
      title: req.body.title,
      description: filteredDescription,
      image: req.file.path, // secure_url returned by multer-cloudinary
      imagePublicId: req.file.filename, // public_id used when deleting
      type: req.body.type,
      createdBy: req.user?.id,
    });

    const savedCard = await newCard.save();
    res.status(201).json({ message: 'Card created successfully', card: savedCard });
  } catch (error) {
    res.status(500).json({ message: 'Error saving card to database', error });
  }
};

// Get All Cards
exports.getCards = (req, res) => {
  Card.find()
    .then((cards) => res.status(200).json(cards))
    .catch((error) => res.status(500).json({ message: 'Error fetching cards', error }));
};

// Get Card by ID
exports.getCardById = (req, res) => {
  Card.findById(req.params.id)
    .then((card) => {
      if (!card) return res.status(404).json({ message: 'Card not found' });
      res.status(200).json(card);
    })
    .catch((error) => res.status(500).json({ message: 'Error fetching card', error }));
};

// Update Card
// exports.updateCard = (req, res) => {
//   Card.findByIdAndUpdate(req.params.id, req.body, { new: true })
//     .then((card) => {
//       if (!card) return res.status(404).json({ message: 'Card not found' });
//       res.status(200).json({ message: 'Card updated successfully', card });
//     })
//     .catch((error) => res.status(500).json({ message: 'Error updating card', error }));
// };

// exports.updateCard = async (req, res) => {
//   try {
//     let updatedData = { ...req.body };

//     // Convert stringified JSON description to object
//     if (req.body.description) {
//       const parsed = JSON.parse(req.body.description);

//       // Optionally filter valid types
//       updatedData.description = parsed.filter((block) =>
//         ['heading', 'paragraph', 'list', 'quote'].includes(block.type)
//       );
//     }

//     const updatedCard = await Card.findByIdAndUpdate(req.params.id, updatedData, { new: true });

//     if (!updatedCard) {
//       return res.status(404).json({ message: 'Card not found' });
//     }

//     res.status(200).json({ message: 'Card updated successfully', card: updatedCard });
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating card', error });
//   }
// };

exports.updateCard = async (req, res) => {

  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    let updatedData = { ...req.body };

    // Parse and sanitize description if provided
    if (req.body.description) {
      try {
        const parsed = JSON.parse(req.body.description);
        updatedData.description = parsed.filter((block) =>
          ['heading', 'paragraph', 'list', 'quote'].includes(block.type)
        );
      } catch (parseErr) {
        return res.status(400).json({ message: 'Invalid description format', error: parseErr });
      }
    }

    // Handle image update
    if (req.file && req.file.path) {
      // Delete old image from Cloudinary if exists
      if (card.imagePublicId) {
        await cloudinary.uploader.destroy(card.imagePublicId);
      }

      // Upload new image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'cards',
      });

      updatedData.image = uploadResult.secure_url;
      updatedData.imagePublicId = uploadResult.public_id;
    }

    const updatedCard = await Card.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    res.status(200).json({ message: 'Card updated successfully', card: updatedCard });
  } catch (error) {
    res.status(500).json({ message: 'Error updating card', error });
  }
};



// Delete Card
exports.deleteCard = (req, res) => {
  Card.findByIdAndDelete(req.params.id)
    .then((card) => {
      if (!card) return res.status(404).json({ message: 'Card not found' });

      if (card.imagePublicId) {
        cloudinary.uploader.destroy(card.imagePublicId, (err) => {
          if (err) return res.status(500).json({ message: 'Error deleting image from Cloudinary', error: err });
        });
      }

      res.status(200).json({ message: 'Card deleted successfully' });
    })
    .catch((error) => res.status(500).json({ message: 'Error deleting card', error }));
};

// Count Cards by Category
exports.getCardCountByCategory = (req, res) => {
  Card.countDocuments({ type: req.params.category })
    .then((count) => res.status(200).json({ category: req.params.category, count }))
    .catch((error) => res.status(500).json({ message: 'Error counting cards by category', error }));
};

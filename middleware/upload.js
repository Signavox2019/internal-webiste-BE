const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS with environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,          // ✅ from .env
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  // ✅ from .env
  region: process.env.AWS_REGION                       // ✅ from .env
});

// Create S3 instance
const s3 = new AWS.S3();

// Configure multer to use S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,  // ✅ bucket name from .env
    acl: 'public-read',                  // ✅ files are public by default
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName); // ✅ generate unique file names
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
    }
  }
});

module.exports = upload;

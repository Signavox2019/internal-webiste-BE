// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const s3 = require('../config/s3');

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: process.env.AWS_BUCKET_NAME,
//         // Remove the ACL line
//         metadata: (req, file, cb) => {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: (req, file, cb) => {
//             const fileName = `uploads/${Date.now()}-${file.originalname}`;
//             cb(null, fileName);
//         },
//     }),
// });

// module.exports = upload;



const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3');

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE, // ✅ fixes download issue
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `uploads/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        },
    }),
});

module.exports = upload;

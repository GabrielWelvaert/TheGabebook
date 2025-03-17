const multer = require("multer");
// const multerS3 = require("multer-s3");
// const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");
const crypto = require('crypto');

const storageType = process.env.STORAGE_TYPE;

// storage setting for local environment
const localStorage = multer.diskStorage({
    destination: function (req, file, cb){
        const uploadDir = path.join(__dirname, '..', 'private');
        cb(null, uploadDir);
    },
    filename: function (req, file, cb){
        let mediaIdentifier = ""
        switch(req.originalUrl){
            case '/user/updateProfilePic':{
                mediaIdentifier = "ProfilePic";
            } break;
            case '/user/updateHeaderPic':{
                mediaIdentifier = "HeaderPic";
            } break;
        }
        const fileExt = path.extname(file.originalname); 
        const rawName = `${req.session.userId}_${mediaIdentifier}`;
        const hash = crypto.createHash('sha256').update(rawName).digest('hex');
        cb(null, `${hash}${fileExt}`); // Append original file extension
    }
});

// // S3 Storage Setup
// const s3 = new S3Client({
//     region: process.env.AWS_REGION,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     },
// });

// const s3Storage = multerS3({
//     s3: s3,
//     bucket: process.env.S3_BUCKET_NAME,
//     contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set MIME type
//     key: function (req, file, cb) {
//         cb(null, `uploads/${Date.now()}_${file.originalname}`);
//     },
// });

// this middleware automatically uploads files for selected routes
const upload = multer({
    storage: storageType === "local" ? localStorage : null,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type"), false);
        }
        cb(null, true);
    }
});

module.exports = upload;

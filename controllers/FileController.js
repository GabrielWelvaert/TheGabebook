const path = require('path');
const ServerUtils = require('./serverUtils.js');
const fs = require('fs');

const storageType = process.env.STORAGE_TYPE;

// controller for downloading a file
const FileController = {
    async getFile(req, res){
        try {
            const fileLocator = req.params.fileLocator;
            if(storageType === "local") {
                let filePath = path.join(__dirname, "..", "private", fileLocator);
                if(!fs.existsSync(filePath)) {
                    filePath = path.join(__dirname, "..", 'public/images/default-avatar.jpg');
                    return res.sendFile(filePath);
                }
                return res.sendFile(filePath);
            } else if (storageType === "s3") {
                const s3Client = new s3();
                const params = { Bucket: process.env.S3_BUCKET_NAME, Key: fileLocator };
                try {
                    const s3Head = await s3Client.headObject(params).promise();
                    const contentType = s3Head.ContentType || 'application/octet-stream'; // Default to binary if unknown

                    const s3Stream = s3Client.getObject(params).createReadStream();
                    res.setHeader("Content-Type", contentType);
                    return s3Stream.pipe(res);
                } catch (err) {
                    return res.status(404).json({ success: false, message: "File not found in S3" });
                }
            }
        } catch (error) {
            return res.status(500).json({success:false, message: error.message});
        }
    }
}   

module.exports = FileController;
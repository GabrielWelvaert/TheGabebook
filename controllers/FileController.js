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
                if(!fs.existsSync(filePath) || !fileLocator) {
                    filePath = path.join(__dirname, "..", 'public/images/default-avatar.jpg');
                    return res.sendFile(filePath);
                }
                return res.sendFile(filePath);
            }
        } catch (error) {
            return res.status(500).json({success:false, message: error.message});
        }
    },
    // delete file function exists in serverUtils. its not a controller.

}   

module.exports = FileController;
const express = require('express');
const router = express.Router();
const FileController = require('../controllers/FileController');

router.get('/getFile/:fileLocator', FileController.getFile);

module.exports = router;
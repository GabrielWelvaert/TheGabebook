const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const csrfProtection = require('../server');
const upload = require("../middleware/uploadMiddleware")

// associate an URL with a controller 
router.post('/register', csrfProtection, UserController.registerUser);
router.post('/login',  csrfProtection, UserController.loginUser);
router.get('/profile', UserController.profilePage);
router.post('/updateInfo', csrfProtection, UserController.updateInfo);
router.get('/getInfo', UserController.getInfo);
router.post('/updateProfilePic', csrfProtection, upload.single("file"), UserController.updateProfilePic);
router.post('/updateHeaderPic', csrfProtection, upload.single("file"), UserController.updateHeaderPic);
module.exports = router;
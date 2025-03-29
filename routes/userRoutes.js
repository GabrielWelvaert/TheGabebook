const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const csrfProtection = require('../server');
const upload = require("../middleware/uploadMiddleware");
const validateFriendship = require('../middleware/friendValidationMiddleware');

// associate an URL with a controller 
router.post('/register', csrfProtection, UserController.registerUser);
router.post('/login',  csrfProtection, UserController.loginUser);
router.get('/profile/:userUUID?', UserController.profilePage);
router.post('/updateInfo', csrfProtection, UserController.updateInfo);
router.get('/getInfo/:userUUID?', validateFriendship, UserController.getInfo);
router.get('/getName/:userUUID?', UserController.getName);
router.post('/updateProfilePic', csrfProtection, upload.single("file"), UserController.updateProfilePic);
router.post('/updateHeaderPic', csrfProtection, upload.single("file"), UserController.updateHeaderPic);
router.get('/getProfilePicLocator/:userUUID?', validateFriendship, UserController.getProfileLocator);
router.get('/getHeaderPicLocator/:userUUID?', validateFriendship, UserController.getHeaderLocator);
router.get('/UUIDBelongsToSessionUserId/:userUUID?', UserController.UUIDMatchesUserId);
module.exports = router;
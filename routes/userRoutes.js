const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const csrfProtection = require('../server');
const upload = require("../middleware/uploadMiddleware");
const validateFriendship = require('../middleware/friendValidationMiddleware');
const authenticate = require('../middleware/sessionAuthenticator.js');

// associate an URL with a controller 
router.post('/register', csrfProtection, UserController.registerUser);
router.post('/login', csrfProtection, UserController.loginUser);
router.get('/profile/:userUUID?', authenticate, UserController.profilePage);
router.post('/updateInfo', authenticate, csrfProtection, UserController.updateInfo);
router.get('/getInfo/:userUUID?', authenticate, validateFriendship, UserController.getInfo);
router.get('/getName/:userUUID?', authenticate, UserController.getName);
router.post('/updateProfilePic', authenticate, csrfProtection, upload.single("file"), UserController.updateProfilePic);
router.post('/updateHeaderPic', authenticate, csrfProtection, upload.single("file"), UserController.updateHeaderPic);
router.get('/getProfilePicLocator/:userUUID?', authenticate, UserController.getProfileLocator);
router.get('/getHeaderPicLocator/:userUUID?', authenticate, UserController.getHeaderLocator);
router.get('/UUIDBelongsToSessionUserId/:userUUID?', authenticate, UserController.UUIDMatchesUserId);
router.get('/deletePage', authenticate, UserController.deletePage);
router.post('/delete', authenticate, csrfProtection, UserController.delete);
router.post('/logout', authenticate, csrfProtection, UserController.logout);
router.post('/searchUser', authenticate, csrfProtection, UserController.searchUser);

module.exports = router;
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// associate an URL with a controller
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.get('/profile', UserController.profilePage);
router.post('/post', UserController.post);

module.exports = router;
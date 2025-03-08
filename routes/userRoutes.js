const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const csrfProtection = require('../server');

// associate an URL with a controller 
router.post('/register', csrfProtection, UserController.registerUser);
router.post('/login',  csrfProtection, UserController.loginUser);
router.get('/profile', UserController.profilePage);
router.post('/updateInfo', csrfProtection, UserController.updateInfo);
router.get('/getInfo', UserController.getInfo);

module.exports = router;
const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const validateFriendship = require('../middleware/friendValidationMiddleware');
const messageController = require('../controllers/MessageController');

router.get('/messages', messageController.messages); // redirects to messages page
router.post('/sendMessage', csrfProtection, validateFriendship, messageController.sendMessage)

module.exports = router;
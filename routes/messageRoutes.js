const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const validateFriendship = require('../middleware/friendValidationMiddleware');
const messageController = require('../controllers/MessageController');

router.get('/messages', messageController.messages); // redirects to messages page
router.post('/sendMessage/:otherUUID?', csrfProtection, validateFriendship, messageController.sendMessage);
router.get('/conversation/:otherUUID', validateFriendship, messageController.getConversation);
router.get('/allConversations', messageController.getActiveConversationFriends);
router.get('/getMostRecentMessageTime/:otherUUID', validateFriendship, messageController.getMostRecentMessageTime);
router.get('/getMostRecentMessage/:otherUUID', validateFriendship, messageController.getMostRecentMessage)

module.exports = router;
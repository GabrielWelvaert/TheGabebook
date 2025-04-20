const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const FriendshipController = require('../controllers/FriendshipController');
const validateFriendship = require('../middleware/friendValidationMiddleware');

// prefixed with friendship

router.get('/getFriendshipStatus/:otherUUID', FriendshipController.getFriendshipStatus);
router.post('/sendFriendRequest/:otherUUID', csrfProtection, FriendshipController.sendFriendRequest);
router.post('/acceptFriendRequest/:otherUUID', csrfProtection, FriendshipController.acceptFriendRequest);
router.post('/terminate/:otherUUID', csrfProtection, FriendshipController.terminate);
router.get('/friendRequests', FriendshipController.friendRequests); // redirects to friendRequests page
router.get('/getAllOutgoing', FriendshipController.getAllOutgoing);
router.get('/getAllIncoming', FriendshipController.getAllIncoming);
router.get('/getAll/:otherUUID?', validateFriendship, FriendshipController.getAll);
router.post('/friendSearch', csrfProtection, FriendshipController.friendSearch);

module.exports = router;
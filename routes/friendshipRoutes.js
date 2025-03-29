const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const FriendshipController = require('../controllers/FriendshipController');

router.get('/getFriendshipStatus/:otherUUID', FriendshipController.getFriendshipStatus);
router.post('/sendFriendRequest/:otherUUID', csrfProtection, FriendshipController.sendFriendRequest);
router.post('/acceptFriendRequest/:otherUUID', csrfProtection, FriendshipController.acceptFriendRequest);
router.post('/terminate/:otherUUID', csrfProtection, FriendshipController.terminate);

module.exports = router;
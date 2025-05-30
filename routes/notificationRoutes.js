const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const validateFriendship = require('../middleware/friendValidationMiddleware');
const notificationController = require('../controllers/NotificationController');

// notifications pertain only to activity (ex: liked post, liked comment, commented, accepted friend request)
// all other "notifications" (ex: message, incoming friend request) are not represented in the notification model
// as they exist in their own models... thats why they're separated

router.post('/createNotification', csrfProtection, validateFriendship, notificationController.createNotification);
router.post('/seen', csrfProtection, notificationController.seen);
router.get('/getNotifications', notificationController.getNotifications);

module.exports = router;
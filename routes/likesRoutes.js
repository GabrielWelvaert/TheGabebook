const express = require('express');
const router = express.Router();
const LikesController = require('../controllers/LikesController');
const csrfProtection = require('../server');
const validateFriendship = require('../middleware/friendValidationMiddleware');

router.post('/likePost/:postUUID?', csrfProtection, validateFriendship, LikesController.likePost);
router.post('/likeComment/:commentUUID?', csrfProtection, validateFriendship, LikesController.likeComment);
router.get('/getLikesAndUserLiked/:postId', validateFriendship, LikesController.getLikesAndUserLiked);

module.exports = router;
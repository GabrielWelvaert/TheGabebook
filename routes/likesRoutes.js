const express = require('express');
const router = express.Router();
const LikesController = require('../controllers/LikesController');
const csrfProtection = require('../server');

router.post('/likePost', csrfProtection, LikesController.likePost);
router.get('/getLikesAndUserLiked/:postId', LikesController.getLikesAndUserLiked);

module.exports = router;
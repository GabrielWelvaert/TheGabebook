const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const csrfProtection = require('../server');

router.get('getCommentsForPost/:postId', CommentController.getCommentsForPost);

module.exports = router;
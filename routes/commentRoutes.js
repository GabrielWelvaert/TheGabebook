const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const csrfProtection = require('../server');

router.post('/submitComment', csrfProtection, CommentController.submitComment);
router.post('/deleteComment', csrfProtection, CommentController.deleteComment);

module.exports = router;
const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const csrfProtection = require('../server');

router.post('/submitComment/:commentUUID?', csrfProtection, CommentController.submitComment);
router.post('/deleteComment/:commentUUID?', csrfProtection, CommentController.deleteComment);

module.exports = router;
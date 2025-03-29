const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const csrfProtection = require('../server');
const validateFriendship = require('../middleware/friendValidationMiddleware');

router.post('/submitComment/', csrfProtection, validateFriendship, CommentController.submitComment);
router.post('/deleteComment/', csrfProtection, CommentController.deleteComment);

module.exports = router;
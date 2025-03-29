const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');
const csrfProtection = require('../server');
const validateFriendship = require('../middleware/friendValidationMiddleware');

router.post('/submitPost',  csrfProtection, PostController.submitPost);
router.post('/deletePost',  csrfProtection, PostController.deletePost);
router.get('/getPosts/:userUUID?', validateFriendship, PostController.getPosts);
router.get('/getAllCommentsForPost/:postId', validateFriendship, PostController.getAllCommentsForPost);

module.exports = router;
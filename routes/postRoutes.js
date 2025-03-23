const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');
const csrfProtection = require('../server');

router.post('/submitPost',  csrfProtection, PostController.submitPost);
router.post('/deletePost',  csrfProtection, PostController.deletePost);
router.get('/getPosts', PostController.getPosts);
router.get('/getAllCommentsForPost/:postId', PostController.getAllCommentsForPost);

module.exports = router;
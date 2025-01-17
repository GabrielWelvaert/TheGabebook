const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');
const csrfProtection = require('../server');

router.post('/submitPost',  csrfProtection, PostController.submitPost);
router.get('/getPosts', PostController.getPosts);


module.exports = router;
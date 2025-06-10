const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const FeedController = require('../controllers/FeedController');

router.get('/getFeed/:postUUID?', FeedController.getFeed);

module.exports = router;
const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const PasstokenController = require("../controllers/PasstokenController");

router.post('/createResetToken', csrfProtection, PasstokenController.createResetToken);
router.get('/validateResetToken/:token', PasstokenController.validateResetToken); // getting the html
router.post('/createConfirmToken', csrfProtection, PasstokenController.createConfirmToken);
router.get('/validateConfirmToken/:token', PasstokenController.validateConfirmToken);

module.exports = router;
const express = require('express');
const router = express.Router();
const csrfProtection = require('../server');
const PasstokenController = require("../controllers/PasstokenController");

router.post('/createResetToken', csrfProtection, PasstokenController.createResetToken);
router.get('/validateResetToken/:token', PasstokenController.validateResetToken);
router.post('/createConfirmToken', csrfProtection, PasstokenController.createConfirmToken);
router.post('/validateConfirmToken/:token', csrfProtection, PasstokenController.validateConfirmToken);

module.exports = router;
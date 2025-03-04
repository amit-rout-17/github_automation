const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// POST route for handling webhook callbacks
router.post('/webhook', webhookController.handleWebhook);

module.exports = router;

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth');

router.get('/plans', subscriptionController.getPlans);
router.post('/checkout', protect, subscriptionController.createCheckout);
router.get('/status', protect, subscriptionController.getSubscription);

// Webhook endpoint needs raw body, handled carefully in Express, but usually we just pass normal body or use body-parser raw
// Usually the webhook needs express.raw({ type: 'application/json' }) which should be configured in index.js for this specific route.
// For simplicity in this demo, we'll assume it works with the existing express.json or we'll adjust index.js if needed.
// IMPORTANT: Stripe webhooks must use raw body.
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

module.exports = router;

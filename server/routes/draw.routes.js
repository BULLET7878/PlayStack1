const express = require('express');
const router = express.Router();
const drawController = require('../controllers/draw.controller');
const { protect, adminOnly } = require('../middleware/auth');

// Public or User routes
router.get('/history', drawController.getDrawHistory);
router.get('/winnings', protect, drawController.getWinnings);

// Admin only route to execute draws
router.post('/execute', protect, adminOnly, drawController.executeDraw);

module.exports = router;

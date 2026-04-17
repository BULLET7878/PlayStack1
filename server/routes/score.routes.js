const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/score.controller');
const { protect, activeSubscriptionOnly } = require('../middleware/auth');

router.get('/', protect, scoreController.getScores);
router.post('/', protect, activeSubscriptionOnly, scoreController.addScore);
router.delete('/:id', protect, scoreController.deleteScore);

module.exports = router;

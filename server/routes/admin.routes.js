const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin privileges
router.use(protect, adminOnly);

router.get('/stats', adminController.getStats);
router.get('/winners/pending', adminController.getPendingWinners);
router.post('/winners/:id/verify', adminController.verifyWinner);

module.exports = router;

const express = require('express');
const router = express.Router();
const charityController = require('../controllers/charity.controller');

router.get('/', charityController.getCharities);
router.get('/featured', charityController.getFeaturedCharities);

module.exports = router;

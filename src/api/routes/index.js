const express = require('express');
const chartRoutes = require('./chart.routes');
const healthRoutes = require('./health.routes');

const router = express.Router();

// API routes
router.use('/chart', chartRoutes);

// Health and metrics routes (at root level)
router.use('/', healthRoutes);

module.exports = router;


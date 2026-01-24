const express = require('express');
const chartV2Routes = require('./chart.v2.routes');
const healthRoutes = require('./health.routes');

const router = express.Router();

// API v2 routes
router.use('/chart', chartV2Routes); // v2 chart routes

// Health and metrics routes (at root level)
router.use('/', healthRoutes);

module.exports = router;

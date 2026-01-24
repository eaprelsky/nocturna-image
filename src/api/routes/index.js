const express = require('express');
const chartRoutes = require('./chart.routes');
const chartV2Routes = require('./chart.v2.routes');
const healthRoutes = require('./health.routes');

const router = express.Router();

// API routes
router.use('/chart', chartRoutes); // v1 routes (legacy)
router.use('/v2/chart', chartV2Routes); // v2 routes (correct wheel order)

// Health and metrics routes (at root level)
router.use('/', healthRoutes);

module.exports = router;


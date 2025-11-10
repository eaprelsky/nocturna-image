const client = require('prom-client');
const config = require('../config');

// Create a Registry
const register = new client.Registry();

// Add default metrics
if (config.enableMetrics) {
  client.collectDefaultMetrics({ register });
}

// Custom metrics
const chartRendersTotal = new client.Counter({
  name: 'chart_renders_total',
  help: 'Total number of chart renders',
  labelNames: ['type', 'status'],
  registers: [register],
});

const chartRenderDuration = new client.Histogram({
  name: 'chart_render_duration_seconds',
  help: 'Chart rendering duration in seconds',
  labelNames: ['type'],
  buckets: [0.5, 1, 2, 3, 5, 10],
  registers: [register],
});

const chartRenderErrors = new client.Counter({
  name: 'chart_render_errors_total',
  help: 'Total number of chart render errors',
  labelNames: ['type', 'error_code'],
  registers: [register],
});

const browserInstancesActive = new client.Gauge({
  name: 'browser_instances_active',
  help: 'Number of active browser instances',
  registers: [register],
});

module.exports = {
  register,
  chartRendersTotal,
  chartRenderDuration,
  chartRenderErrors,
  browserInstancesActive,
};


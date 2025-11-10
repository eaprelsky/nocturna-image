const browserService = require('../../services/browser.service');
const { register } = require('../../utils/metrics');

class HealthController {
  async healthCheck(req, res) {
    const uptime = process.uptime();
    const browserReady = browserService.isReady();

    const health = {
      status: browserReady ? 'healthy' : 'degraded',
      version: '1.0.0',
      uptime: Math.floor(uptime),
      timestamp: new Date().toISOString(),
      checks: {
        browser: browserReady ? 'ok' : 'not_ready',
        memory: {
          usage: process.memoryUsage().heapUsed,
          limit: process.memoryUsage().heapTotal,
        },
      },
    };

    const statusCode = browserReady ? 200 : 503;
    res.status(statusCode).json(health);
  }

  async metrics(req, res) {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  }
}

module.exports = new HealthController();


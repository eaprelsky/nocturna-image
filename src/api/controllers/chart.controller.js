const chartRendererService = require('../../services/chartRenderer.service');
const logger = require('../../utils/logger');

class ChartController {
  async renderNatalChart(req, res, next) {
    try {
      const chartData = {
        chartType: 'natal',
        planets: req.body.planets,
        houses: req.body.houses,
        aspectSettings: req.body.aspectSettings,
      };

      const renderOptions = req.body.renderOptions || {};

      const result = await chartRendererService.renderChart(chartData, renderOptions);

      res.status(200).json({
        status: 'success',
        data: {
          image: result.image,
          format: result.format,
          size: result.size,
          dimensions: result.dimensions,
          generatedAt: new Date().toISOString(),
        },
        meta: {
          renderTime: result.renderTime,
          version: '1.0.0',
        },
      });
    } catch (error) {
      logger.error('Natal chart render failed', {
        requestId: req.id,
        error: error.message,
      });
      next(error);
    }
  }

  async renderTransitChart(req, res, next) {
    try {
      const chartData = {
        chartType: 'transit',
        natal: req.body.natal,
        transit: req.body.transit,
        aspectSettings: req.body.aspectSettings,
      };

      const renderOptions = req.body.renderOptions || {};

      const result = await chartRendererService.renderChart(chartData, renderOptions);

      // Count aspects (placeholder - would need actual aspect calculation)
      const aspectsFound = {
        natalToTransit: 0, // Would be calculated
        natal: 0,
        transit: 0,
      };

      res.status(200).json({
        status: 'success',
        data: {
          image: result.image,
          format: result.format,
          size: result.size,
          dimensions: result.dimensions,
          generatedAt: new Date().toISOString(),
          chartInfo: {
            type: 'transit',
            transitDatetime: req.body.transit.datetime || new Date().toISOString(),
            aspectsFound,
          },
        },
        meta: {
          renderTime: result.renderTime,
          version: '1.0.0',
        },
      });
    } catch (error) {
      logger.error('Transit chart render failed', {
        requestId: req.id,
        error: error.message,
      });
      next(error);
    }
  }

  async renderSynastryChart(req, res, next) {
    try {
      const chartData = {
        chartType: 'synastry',
        person1: req.body.person1,
        person2: req.body.person2,
        synastrySettings: req.body.synastrySettings,
      };

      const renderOptions = req.body.renderOptions || {};

      const result = await chartRendererService.renderChart(chartData, renderOptions);

      // Count aspects (placeholder - would need actual aspect calculation)
      const aspectsFound = {
        interaspects: 0, // Would be calculated
        person1: 0,
        person2: 0,
      };

      res.status(200).json({
        status: 'success',
        data: {
          image: result.image,
          format: result.format,
          size: result.size,
          dimensions: result.dimensions,
          generatedAt: new Date().toISOString(),
          chartInfo: {
            type: 'synastry',
            person1Name: req.body.person1.name,
            person2Name: req.body.person2.name,
            aspectsFound,
          },
        },
        meta: {
          renderTime: result.renderTime,
          version: '1.0.0',
        },
      });
    } catch (error) {
      logger.error('Synastry chart render failed', {
        requestId: req.id,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = new ChartController();


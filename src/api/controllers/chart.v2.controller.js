const chartRendererService = require('../../services/chartRenderer.service');
const logger = require('../../utils/logger');

class ChartV2Controller {
  async renderNatalChart(req, res, next) {
    try {
      const chartData = {
        chartType: 'natal',
        planets: req.body.planets,
        houses: req.body.houses,
        aspectSettings: req.body.aspectSettings,
      };

      const renderOptions = req.body.renderOptions || {};

      // v2 API: use 'v2' version
      const result = await chartRendererService.renderChart(chartData, renderOptions, 'v2');

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
          version: '2.0.0',
        },
      });
    } catch (error) {
      logger.error('Natal chart render failed (v2)', {
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

      // v2 API: use 'v2' version (natal on inner, transit on outer)
      const result = await chartRendererService.renderChart(chartData, renderOptions, 'v2');

      const aspectsFound = {
        natalToTransit: 0,
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
            wheelOrder: {
              inner: 'natal',
              outer: 'transit',
            },
          },
        },
        meta: {
          renderTime: result.renderTime,
          version: '2.0.0',
        },
      });
    } catch (error) {
      logger.error('Transit chart render failed (v2)', {
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

      // v2 API: use 'v2' version (person1 on inner, person2 on outer)
      const result = await chartRendererService.renderChart(chartData, renderOptions, 'v2');

      const aspectsFound = {
        interaspects: 0,
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
            wheelOrder: {
              inner: 'person1',
              outer: 'person2',
            },
          },
        },
        meta: {
          renderTime: result.renderTime,
          version: '2.0.0',
        },
      });
    } catch (error) {
      logger.error('Synastry chart render failed (v2)', {
        requestId: req.id,
        error: error.message,
      });
      next(error);
    }
  }

  async renderBiwheelChart(req, res, next) {
    try {
      const chartData = {
        chartType: 'biwheel',
        inner: req.body.inner,
        outer: req.body.outer,
        biwheelSettings: req.body.biwheelSettings,
      };

      const renderOptions = req.body.renderOptions || {};

      // v2 API: use 'v2' version (inner on inner, outer on outer)
      const result = await chartRendererService.renderChart(chartData, renderOptions, 'v2');

      const aspectsFound = {
        crossAspects: 0,
        inner: 0,
        outer: 0,
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
            type: 'biwheel',
            innerName: req.body.inner.name,
            outerName: req.body.outer.name,
            aspectsFound,
            wheelOrder: {
              inner: 'inner',
              outer: 'outer',
            },
          },
        },
        meta: {
          renderTime: result.renderTime,
          version: '2.0.0',
        },
      });
    } catch (error) {
      logger.error('Biwheel chart render failed (v2)', {
        requestId: req.id,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = new ChartV2Controller();

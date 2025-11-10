const express = require('express');
const chartController = require('../controllers/chart.controller');
const validate = require('../middlewares/validation.middleware');
const authenticate = require('../middlewares/auth.middleware');
const {
  natalChartSchema,
  transitChartSchema,
  synastryChartSchema,
} = require('../validators/chart.validator');

const router = express.Router();

// Natal chart rendering
router.post('/render', authenticate, validate(natalChartSchema), chartController.renderNatalChart);

// Transit chart rendering
router.post(
  '/render/transit',
  authenticate,
  validate(transitChartSchema),
  chartController.renderTransitChart
);

// Synastry chart rendering
router.post(
  '/render/synastry',
  authenticate,
  validate(synastryChartSchema),
  chartController.renderSynastryChart
);

module.exports = router;


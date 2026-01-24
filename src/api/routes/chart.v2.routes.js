const express = require('express');
const chartController = require('../controllers/chart.v2.controller');
const validate = require('../middlewares/validation.middleware');
const authenticate = require('../middlewares/auth.middleware');
const {
  natalChartSchema,
  transitChartSchema,
  synastryChartSchema,
  biwheelChartSchema,
} = require('../validators/chart.validator');

const router = express.Router();

// Natal chart rendering
router.post('/render', authenticate, validate(natalChartSchema), chartController.renderNatalChart);

// Transit chart rendering (v2: natal on inner, transit on outer)
router.post(
  '/render/transit',
  authenticate,
  validate(transitChartSchema),
  chartController.renderTransitChart
);

// Synastry chart rendering (v2: person1 on inner, person2 on outer)
router.post(
  '/render/synastry',
  authenticate,
  validate(synastryChartSchema),
  chartController.renderSynastryChart
);

// Biwheel chart rendering (v2: inner on inner, outer on outer)
router.post(
  '/render/biwheel',
  authenticate,
  validate(biwheelChartSchema),
  chartController.renderBiwheelChart
);

module.exports = router;

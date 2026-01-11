const {
  natalChartSchema,
  transitChartSchema,
  synastryChartSchema,
} = require('../../../src/api/validators/chart.validator');
const { sampleNatalChart, sampleTransitChart, sampleSynastryChart } = require('../../fixtures/sample-charts');

describe('Chart Validators', () => {
  describe('natalChartSchema', () => {
    test('should validate a valid natal chart', () => {
      const result = natalChartSchema.safeParse(sampleNatalChart);
      expect(result.success).toBe(true);
    });

    test('should reject invalid planet longitude', () => {
      const invalid = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          sun: { lon: 400 }, // Invalid: > 360
        },
      };
      const result = natalChartSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject invalid latitude', () => {
      const invalid = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          moon: { lon: 100, lat: 100 }, // Invalid: > 90
        },
      };
      const result = natalChartSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject wrong number of houses', () => {
      const invalid = {
        ...sampleNatalChart,
        houses: [{ lon: 0 }], // Only 1 house instead of 12
      };
      const result = natalChartSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should apply default render options', () => {
      const minimal = {
        planets: sampleNatalChart.planets,
        houses: sampleNatalChart.houses,
      };
      const result = natalChartSchema.parse(minimal);
      expect(result.renderOptions?.format).toBe('png');
      expect(result.renderOptions?.width).toBe(800);
    });

    test('should accept planets with retrograde status', () => {
      const withRetrograde = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          mercury: { lon: 95.45, lat: -2.3, retrograde: true },
        },
      };
      const result = natalChartSchema.safeParse(withRetrograde);
      expect(result.success).toBe(true);
      expect(result.data?.planets.mercury.retrograde).toBe(true);
    });

    test('should default retrograde to false when not provided', () => {
      const withoutRetrograde = {
        planets: {
          sun: { lon: 85.83, lat: 0.0 },
          moon: { lon: 133.21, lat: 5.12 },
          mercury: { lon: 95.45, lat: -2.3 },
          venus: { lon: 110.2, lat: 1.5 },
          mars: { lon: 45.3, lat: -0.8 },
          jupiter: { lon: 200.15, lat: 0.5 },
          saturn: { lon: 290.45, lat: 2.1 },
          uranus: { lon: 15.6, lat: -0.3 },
          neptune: { lon: 325.8, lat: 1.2 },
          pluto: { lon: 270.25, lat: 15.0 },
        },
        houses: sampleNatalChart.houses,
      };
      const result = natalChartSchema.parse(withoutRetrograde);
      expect(result.planets.sun.retrograde).toBe(false);
      expect(result.planets.mercury.retrograde).toBe(false);
    });

    test('should reject invalid retrograde type', () => {
      const invalid = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          mercury: { lon: 95.45, lat: -2.3, retrograde: 'yes' }, // Should be boolean
        },
      };
      const result = natalChartSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should accept chart with additional planets (Rahu, Ketu, Selena, Lilith)', () => {
      const withAdditionalPlanets = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          rahu: { lon: 123.45, lat: 0.0, retrograde: false },
          ketu: { lon: 303.45, lat: 0.0, retrograde: false },
          selena: { lon: 67.89, lat: 0.0, retrograde: false },
          lilith: { lon: 247.89, lat: 0.0, retrograde: false },
        },
      };
      const result = natalChartSchema.safeParse(withAdditionalPlanets);
      expect(result.success).toBe(true);
      expect(result.data?.planets.rahu).toEqual({ lon: 123.45, lat: 0.0, retrograde: false });
      expect(result.data?.planets.ketu).toEqual({ lon: 303.45, lat: 0.0, retrograde: false });
      expect(result.data?.planets.selena).toEqual({ lon: 67.89, lat: 0.0, retrograde: false });
      expect(result.data?.planets.lilith).toEqual({ lon: 247.89, lat: 0.0, retrograde: false });
    });

    test('should accept chart with only some additional planets', () => {
      const withPartialAdditionalPlanets = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          rahu: { lon: 123.45, lat: 0.0, retrograde: false },
          ketu: { lon: 303.45, lat: 0.0, retrograde: false },
        },
      };
      const result = natalChartSchema.safeParse(withPartialAdditionalPlanets);
      expect(result.success).toBe(true);
      expect(result.data?.planets.rahu).toBeDefined();
      expect(result.data?.planets.ketu).toBeDefined();
      expect(result.data?.planets.selena).toBeUndefined();
      expect(result.data?.planets.lilith).toBeUndefined();
    });

    test('should maintain backward compatibility - chart without additional planets should work', () => {
      // This is the existing sample chart without additional planets
      const result = natalChartSchema.safeParse(sampleNatalChart);
      expect(result.success).toBe(true);
      expect(result.data?.planets.rahu).toBeUndefined();
      expect(result.data?.planets.ketu).toBeUndefined();
      expect(result.data?.planets.selena).toBeUndefined();
      expect(result.data?.planets.lilith).toBeUndefined();
    });

    test('should reject invalid longitude for additional planets', () => {
      const invalid = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          rahu: { lon: 400, lat: 0.0 }, // Invalid: > 360
        },
      };
      const result = natalChartSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('transitChartSchema', () => {
    test('should validate a valid transit chart', () => {
      const result = transitChartSchema.safeParse(sampleTransitChart);
      expect(result.success).toBe(true);
    });

    test('should require natal and transit data', () => {
      const invalid = { natal: sampleTransitChart.natal };
      const result = transitChartSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('synastryChartSchema', () => {
    test('should validate a valid synastry chart', () => {
      const result = synastryChartSchema.safeParse(sampleSynastryChart);
      expect(result.success).toBe(true);
    });

    test('should require both person1 and person2', () => {
      const invalid = { person1: sampleSynastryChart.person1 };
      const result = synastryChartSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should apply default synastry settings', () => {
      const minimal = {
        person1: sampleSynastryChart.person1,
        person2: sampleSynastryChart.person2,
      };
      const result = synastryChartSchema.parse(minimal);
      expect(result.synastrySettings?.useHousesFrom).toBe('person1');
    });
  });
});


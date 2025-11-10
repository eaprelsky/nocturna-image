const chartRendererService = require('../../../src/services/chartRenderer.service');

describe('ChartRendererService', () => {
  describe('loadTemplate', () => {
    test('should load and cache template', async () => {
      const template1 = await chartRendererService.loadTemplate('chart.html');
      const template2 = await chartRendererService.loadTemplate('chart.html');
      
      expect(template1).toBeDefined();
      expect(template1).toBe(template2); // Should return cached version
      expect(template1).toContain('<!DOCTYPE html>');
    });

    test('should throw error for non-existent template', async () => {
      await expect(
        chartRendererService.loadTemplate('non-existent.html')
      ).rejects.toThrow();
    });
  });

  describe('prepareChartConfig', () => {
    test('should prepare natal chart config', () => {
      const chartData = {
        planets: { sun: { lon: 85.83 } },
        houses: [{ lon: 300 }],
        aspectSettings: { enabled: true, orb: 6 },
      };
      const renderOptions = { width: 800, height: 800 };

      const config = chartRendererService.prepareChartConfig(chartData, renderOptions);

      expect(config.planets).toEqual(chartData.planets);
      expect(config.houses).toEqual(chartData.houses);
      expect(config.aspectSettings).toEqual(chartData.aspectSettings);
    });

    test('should prepare transit chart config', () => {
      const chartData = {
        natal: {
          planets: { sun: { lon: 85.83 } },
          houses: [{ lon: 300 }],
        },
        transit: {
          planets: { sun: { lon: 120.5 } },
        },
        aspectSettings: {
          natal: { enabled: true },
          natalToTransit: { enabled: true },
        },
      };

      const config = chartRendererService.prepareChartConfig(chartData, {});

      expect(config.planets).toEqual(chartData.natal.planets);
      expect(config.secondaryPlanets).toEqual(chartData.transit.planets);
      expect(config.primaryAspectSettings).toBeDefined();
      expect(config.synastryAspectSettings).toBeDefined();
    });
  });

  describe('injectDataIntoTemplate', () => {
    test('should inject config into template', () => {
      const template = '<script>/* CHART_CONFIG_PLACEHOLDER */</script>';
      const config = { planets: {}, houses: [] };

      const result = chartRendererService.injectDataIntoTemplate(template, config);

      expect(result).toContain('const chartConfig =');
      expect(result).toContain(JSON.stringify(config, null, 2));
    });
  });
});


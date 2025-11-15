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

    test('should prepare synastry chart config', () => {
      const chartData = {
        person1: {
          planets: { sun: { lon: 85.83 } },
          houses: [{ lon: 300 }],
        },
        person2: {
          planets: { moon: { lon: 120.5 } },
          houses: [{ lon: 45 }],
        },
        synastrySettings: {
          useHousesFrom: 'person1',
          aspectSettings: {
            person1: { enabled: true },
            interaspects: { enabled: true },
          },
        },
      };

      const config = chartRendererService.prepareChartConfig(chartData, {});

      expect(config.planets).toEqual(chartData.person1.planets);
      expect(config.secondaryPlanets).toEqual(chartData.person2.planets);
      expect(config.houses).toEqual(chartData.person1.houses);
      expect(config.primaryAspectSettings).toBeDefined();
      expect(config.synastryAspectSettings).toBeDefined();
    });

    test('should use person2 houses when specified in synastry', () => {
      const chartData = {
        person1: {
          planets: { sun: { lon: 85.83 } },
          houses: [{ lon: 300 }],
        },
        person2: {
          planets: { moon: { lon: 120.5 } },
          houses: [{ lon: 45 }],
        },
        synastrySettings: {
          useHousesFrom: 'person2',
        },
      };

      const config = chartRendererService.prepareChartConfig(chartData, {});

      expect(config.houses).toEqual(chartData.person2.houses);
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

  describe('captureImage', () => {
    let mockPage;
    let mockElement;

    beforeEach(() => {
      mockElement = {
        screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
      };
      mockPage = {
        $: jest.fn().mockResolvedValue(mockElement),
      };
    });

    test('should capture PNG image with default options', async () => {
      const buffer = await chartRendererService.captureImage(mockPage, {});

      expect(mockPage.$).toHaveBeenCalledWith('#chart-container');
      expect(mockElement.screenshot).toHaveBeenCalledWith({
        type: 'png',
        encoding: 'binary',
        quality: 90,
      });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    test('should capture JPEG image with custom quality', async () => {
      await chartRendererService.captureImage(mockPage, {
        format: 'jpeg',
        quality: 80,
      });

      expect(mockElement.screenshot).toHaveBeenCalledWith({
        type: 'jpeg',
        encoding: 'binary',
        quality: 80,
      });
    });

    test('should capture PNG image when format is specified', async () => {
      await chartRendererService.captureImage(mockPage, {
        format: 'png',
        quality: 95,
      });

      expect(mockElement.screenshot).toHaveBeenCalledWith({
        type: 'png',
        encoding: 'binary',
        quality: 95,
      });
    });

    test('should throw error when chart container not found', async () => {
      mockPage.$.mockResolvedValue(null);

      await expect(
        chartRendererService.captureImage(mockPage, {})
      ).rejects.toThrow('Chart container not found');
    });
  });
});


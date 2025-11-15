// Set environment variables BEFORE importing app
process.env.API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { sampleNatalChart, sampleTransitChart, sampleSynastryChart } = require('../../fixtures/sample-charts');

// Mock browser service to avoid actually launching Chrome in tests
jest.mock('../../../src/services/browser.service');
jest.mock('../../../src/services/chartRenderer.service');

const app = require('../../../src/app');
const mockChartRenderer = require('../../../src/services/chartRenderer.service');
const mockBrowserService = require('../../../src/services/browser.service');

describe('Chart API Routes', () => {
  const validApiKey = 'test-api-key';

  beforeAll(() => {
    // Mock browser service methods
    mockBrowserService.isReady = jest.fn().mockReturnValue(true);
    mockBrowserService.initialize = jest.fn().mockResolvedValue({});
    mockBrowserService.getPage = jest.fn().mockResolvedValue({
      close: jest.fn(),
    });
    mockBrowserService.closePage = jest.fn().mockResolvedValue();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockChartRenderer.renderChart.mockResolvedValue({
      image: 'base64encodedimage',
      format: 'png',
      size: 12345,
      dimensions: { width: 800, height: 800 },
      renderTime: 1000,
    });
  });

  describe('POST /api/v1/chart/render', () => {
    test('should render natal chart with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send(sampleNatalChart)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.format).toBe('png');
      expect(response.body.meta.version).toBeDefined();
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render')
        .send(sampleNatalChart)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    test('should reject invalid planet data', async () => {
      const invalid = {
        ...sampleNatalChart,
        planets: {
          ...sampleNatalChart.planets,
          sun: { lon: 400 }, // Invalid longitude
        },
      };

      const response = await request(app)
        .post('/api/v1/chart/render')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send(invalid)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject request with invalid API key', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render')
        .set('Authorization', 'Bearer invalid-key')
        .send(sampleNatalChart)
        .expect(401);

      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /metrics', () => {
    test('should return Prometheus metrics', async () => {
      const response = await request(app).get('/metrics').expect(200);

      expect(response.text).toContain('chart_renders_total');
      expect(response.text).toContain('chart_render_duration_seconds');
    });
  });

  describe('GET /', () => {
    test('should return API info', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body.name).toBe('Nocturna Chart Service');
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('POST /api/v1/chart/render/transit', () => {
    test('should render transit chart with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render/transit')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send(sampleTransitChart)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.chartInfo.type).toBe('transit');
      expect(response.body.data.chartInfo.transitDatetime).toBeDefined();
      expect(response.body.data.chartInfo.aspectsFound).toBeDefined();
    });

    test('should reject transit chart without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render/transit')
        .send(sampleTransitChart)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    test('should reject invalid transit data', async () => {
      const invalid = {
        ...sampleTransitChart,
        natal: { planets: {}, houses: [] }, // Invalid: missing required planets
      };

      const response = await request(app)
        .post('/api/v1/chart/render/transit')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send(invalid)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/chart/render/synastry', () => {
    test('should render synastry chart with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render/synastry')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send(sampleSynastryChart)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.chartInfo.type).toBe('synastry');
      expect(response.body.data.chartInfo.person1Name).toBe('John');
      expect(response.body.data.chartInfo.person2Name).toBe('Jane');
      expect(response.body.data.chartInfo.aspectsFound).toBeDefined();
    });

    test('should reject synastry chart without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render/synastry')
        .send(sampleSynastryChart)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    test('should reject invalid synastry data', async () => {
      const invalid = {
        person1: sampleSynastryChart.person1,
        // Missing person2
      };

      const response = await request(app)
        .post('/api/v1/chart/render/synastry')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send(invalid)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('404 handler', () => {
    test('should return 404 for non-existent route', async () => {
      const response = await request(app).get('/non-existent').expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});


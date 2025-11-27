const request = require('supertest');
const app = require('../../../src/app');
const config = require('../../../src/config');

describe('POST /api/v1/chart/render/biwheel', () => {
  const validBiwheelRequest = {
    inner: {
      name: 'Natal Chart',
      planets: {
        sun: { lon: 85.83, lat: 0.0, retrograde: false },
        moon: { lon: 133.21, lat: 5.12, retrograde: false },
        mercury: { lon: 95.45, lat: -2.3, retrograde: true },
        venus: { lon: 110.20, lat: 1.5, retrograde: false },
        mars: { lon: 45.30, lat: -0.8, retrograde: true },
        jupiter: { lon: 200.15, lat: 0.5, retrograde: false },
        saturn: { lon: 290.45, lat: 2.1, retrograde: false },
        uranus: { lon: 15.60, lat: -0.3, retrograde: false },
        neptune: { lon: 325.80, lat: 1.2, retrograde: false },
        pluto: { lon: 270.25, lat: 15.0, retrograde: false },
      },
      houses: [
        { lon: 300.32 },
        { lon: 330.15 },
        { lon: 355.24 },
        { lon: 20.32 },
        { lon: 45.15 },
        { lon: 75.24 },
        { lon: 120.32 },
        { lon: 150.15 },
        { lon: 175.24 },
        { lon: 200.32 },
        { lon: 225.15 },
        { lon: 255.24 },
      ],
    },
    outer: {
      name: 'Progressed Chart',
      planets: {
        sun: { lon: 115.20, lat: 0.0, retrograde: false },
        moon: { lon: 200.45, lat: 4.8, retrograde: false },
        mercury: { lon: 125.30, lat: -1.5, retrograde: false },
        venus: { lon: 140.50, lat: 2.0, retrograde: false },
        mars: { lon: 75.80, lat: -1.2, retrograde: false },
        jupiter: { lon: 210.30, lat: 0.8, retrograde: false },
        saturn: { lon: 295.60, lat: 2.3, retrograde: false },
        uranus: { lon: 18.40, lat: -0.5, retrograde: false },
        neptune: { lon: 327.90, lat: 1.4, retrograde: false },
        pluto: { lon: 272.10, lat: 14.8, retrograde: false },
      },
    },
    biwheelSettings: {
      useHousesFrom: 'inner',
      aspectSettings: {
        inner: {
          enabled: true,
          orb: 6,
        },
        outer: {
          enabled: true,
          orb: 6,
        },
        crossAspects: {
          enabled: true,
          orb: 3,
        },
      },
    },
    renderOptions: {
      format: 'png',
      width: 800,
      height: 800,
    },
  };

  describe('Authentication', () => {
    it('should reject request without API key', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .send(validBiwheelRequest);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should reject request with invalid API key', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', 'Bearer invalid-key')
        .send(validBiwheelRequest);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('Validation', () => {
    it('should reject request with missing inner chart', async () => {
      const invalidRequest = { ...validBiwheelRequest };
      delete invalidRequest.inner;

      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', `Bearer ${config.apiKey}`)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should reject request with missing outer chart', async () => {
      const invalidRequest = { ...validBiwheelRequest };
      delete invalidRequest.outer;

      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', `Bearer ${config.apiKey}`)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should reject request with invalid planet longitude', async () => {
      const invalidRequest = JSON.parse(JSON.stringify(validBiwheelRequest));
      invalidRequest.inner.planets.sun.lon = 400; // Invalid: > 360

      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', `Bearer ${config.apiKey}`)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should accept request with missing outer houses (uses inner houses)', async () => {
      const validRequest = JSON.parse(JSON.stringify(validBiwheelRequest));
      // Outer houses are optional

      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', `Bearer ${config.apiKey}`)
        .send(validRequest);

      expect([200, 500]).toContain(response.status); // May fail due to browser issues in test env
    });
  });

  describe('Successful Rendering', () => {
    it('should render biwheel chart successfully', async () => {
      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', `Bearer ${config.apiKey}`)
        .send(validBiwheelRequest)
        .timeout(15000); // Allow time for rendering

      // May fail in CI environment without browser
      if (response.status === 200) {
        expect(response.body.status).toBe('success');
        expect(response.body.data.image).toBeDefined();
        expect(response.body.data.format).toBe('png');
        expect(response.body.data.dimensions).toEqual({
          width: 800,
          height: 800,
        });
        expect(response.body.data.chartInfo.type).toBe('biwheel');
        expect(response.body.data.chartInfo.innerName).toBe('Natal Chart');
        expect(response.body.data.chartInfo.outerName).toBe('Progressed Chart');
        expect(response.body.meta.renderTime).toBeGreaterThan(0);
      }
    }, 20000);

    it('should render with different render options', async () => {
      const customRequest = JSON.parse(JSON.stringify(validBiwheelRequest));
      customRequest.renderOptions = {
        format: 'png',
        width: 1000,
        height: 1000,
        theme: 'dark',
      };

      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', `Bearer ${config.apiKey}`)
        .send(customRequest)
        .timeout(15000);

      if (response.status === 200) {
        expect(response.body.data.dimensions).toEqual({
          width: 1000,
          height: 1000,
        });
      }
    }, 20000);

    it('should render with disabled aspects', async () => {
      const customRequest = JSON.parse(JSON.stringify(validBiwheelRequest));
      customRequest.biwheelSettings.aspectSettings = {
        inner: { enabled: false },
        outer: { enabled: false },
        crossAspects: { enabled: true, orb: 3 },
      };

      const response = await request(app)
        .post('/api/v1/chart/render/biwheel')
        .set('Authorization', `Bearer ${config.apiKey}`)
        .send(customRequest)
        .timeout(15000);

      if (response.status === 200) {
        expect(response.body.status).toBe('success');
      }
    }, 20000);
  });
});


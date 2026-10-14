const request = require('supertest');
const { app, currenciesReady } = require('../server');

describe('GET /health', () => {

  beforeAll(async () => {
    await currenciesReady;
  });

  describe('integration', () => {
    it('should return 200 if all checks pass', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.checks).toHaveProperty('currencyCatalogLoaded');
      expect(res.body.checks.currencyCatalogLoaded.ok).toBe(true);
      expect(res.body.checks).toHaveProperty('frankfurterApi');
      expect(res.body.checks.frankfurterApi.ok).toBe(true);
      expect(res.body.checks.frankfurterApi.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.body.checks).toHaveProperty('openMeteoApi');
      expect(res.body.checks.openMeteoApi.ok).toBe(true);
      expect(res.body.checks.openMeteoApi.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.body.uptimeSeconds).toBeDefined();
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('fault injection (mocked upstream)', () => {

    let fetchSpy;

    const okResponse = () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    });

    // upstream state configuration
    const mockHealthUpstreams = ({ frankfurter = 'up', meteo = 'up' } = {}) => {
      fetchSpy.mockImplementation(async (url) => {
        const target = String(url);
        if (target.includes('frankfurter') && frankfurter === 'down') {
          throw new Error('Frankfurter network error');
        }
        if (target.includes('meteo') && meteo === 'down') {
          throw new Error('Open-Meteo network error');
        }
        return okResponse();
      });
    };


    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('should return 503 when Frankfurter is down', async () => {
      mockHealthUpstreams({ frankfurter: 'down' });
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks).toHaveProperty('frankfurterApi');
      expect(res.body.checks.frankfurterApi.ok).toBe(false);
      expect(res.body.checks.frankfurterApi.message).toContain('network error');
      expect(res.body.checks).toHaveProperty('openMeteoApi');
      expect(res.body.checks.openMeteoApi.ok).toBe(true);
    });

    it('should return 503 when open-meteo is down', async () => {
      mockHealthUpstreams({ meteo: 'down' });
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks).toHaveProperty('frankfurterApi');
      expect(res.body.checks.frankfurterApi.ok).toBe(true);
      expect(res.body.checks).toHaveProperty('openMeteoApi');
      expect(res.body.checks.openMeteoApi.ok).toBe(false);
      expect(res.body.checks.openMeteoApi.message).toContain('network error');
    });

    it('should return 503 with all checks down when both upstreams fail', async () => {
      mockHealthUpstreams({ frankfurter: 'down', meteo: 'down' });
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks).toHaveProperty('frankfurterApi');
      expect(res.body.checks.frankfurterApi.ok).toBe(false);
      expect(res.body.checks.frankfurterApi.message).toContain('network error');
      expect(res.body.checks).toHaveProperty('openMeteoApi');
      expect(res.body.checks.openMeteoApi.ok).toBe(false);
      expect(res.body.checks.openMeteoApi.message).toContain('network error');
    });

  });
});

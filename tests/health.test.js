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

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('should return 503 when Frankfurter is unreachable', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(0),
      });

      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(503);
      expect(res.body.checks).toHaveProperty('frankfurterApi');
      expect(res.body.checks.frankfurterApi.ok).toBe(false);
      expect(res.body.checks.frankfurterApi.message).toContain('Network error');
      expect(res.body.checks).toHaveProperty('openMeteoApi');
      expect(res.body.checks.openMeteoApi.ok).toBe(true);
    });
  });
});

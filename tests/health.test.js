const request = require('supertest');
const { app, currenciesReady } = require('../server');

describe('GET /health', () => {

  beforeAll(async () => {
    await currenciesReady;
  });

  it('should return 200 if all checks pass', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks).toHaveProperty('currencyCatalogLoaded');
    expect(res.body.checks).toHaveProperty('frankfurterApi');
    expect(res.body.uptimeSeconds).toBeDefined();
  });

  it('should include uptime in seconds', async () => {
    const res = await request(app).get('/health');

    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});

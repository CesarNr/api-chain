const request = require('supertest');
const { app, currenciesReady } = require('../server');

describe('GET /trip', () => {

  beforeAll (async () => {
    await currenciesReady;
  });

  it('should return 200 with valid input', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'USD', to: 'COP', lat: '7.12', lon: '-73.11' });

    expect(res.statusCode).toBe(200);
    expect(res.body.trip).toBeDefined();
    expect(res.body.exchange).toBeDefined();
    expect(res.body.weather).toBeDefined();
  });
});

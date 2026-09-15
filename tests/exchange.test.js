const request = require('supertest');
const { app, currenciesReady } = require('../server');

describe('GET /exchange', () => {

  beforeAll (async () => {
    await currenciesReady;
  });
  
  it('should return 200 with valid currencies', async () => {
    const res = await request(app)
      .get('/exchange')
      .query({ from: 'USD', to: 'EUR' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('date');
    expect(res.body).toHaveProperty('base');
    expect(res.body).toHaveProperty('quote');
    expect(res.body).toHaveProperty('rate');
  });

  it('should support USD → COP', async () => {
    const res = await request(app)
      .get('/exchange')
      .query({ from: 'USD', to: 'COP' });

    expect(res.statusCode).toBe(200);
    expect(res.body.rate).toBeDefined();
    expect(typeof res.body.rate).toBe('number');
  });

  it('should return 400 for unsupported currency XXX', async () => {
    const res = await request(app)
      .get('/exchange')
      .query({ from: 'XXX', to: 'EUR' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Unsupported currency');
  });

  it('should return 400 for empty currency code', async () => {
    const res = await request(app)
      .get('/exchange')
      .query({ from: '', to: 'EUR' });

    expect(res.statusCode).toBe(400);
  });
});

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

    expect(res.body.trip.from).toBe('USD');
    expect(res.body.trip.to).toBe('COP');
    expect(res.body.trip.lat).toBe(7.12);
    expect(res.body.trip.lon).toBe(-73.11);

    expect(typeof res.body.exchange.date).toBe('string');
    expect(Number.isFinite(res.body.exchange.rate)).toBe(true);

    expect(Number.isFinite(res.body.weather.temperatureC)).toBe(true);
    expect(Number.isInteger(res.body.weather.weatherCode)).toBe(true);
  });

  it('should apply defaults when no parameters given', async () => {
    const res = await request(app)
      .get('/trip');

    expect(res.statusCode).toBe(200);

    expect(res.body.trip.from).toBe('USD');
    expect(res.body.trip.to).toBe('EUR');
    expect(res.body.trip.lat).toBe(52.52);
    expect(res.body.trip.lon).toBe(13.41);
  });

  it('should return 400 with invalid currency from', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'QwE', to: 'EUR', lat: '7.12', lon: '-73.11' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Unsupported currency code in 'from': QwE");
  });

  it('should return 400 with empty currency to', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'USD', to: '', lat: '7.12', lon: '-73.11' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Parameter 'to' must not be empty");
  });

  it('should return 400 with Out-of-range lat', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'AUD', to: 'PEN', lat: '-90.01', lon: '-77.02' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Latitude: -90.01 is out of bounds");
  });

  it('should return 400 with Out-of-range lon', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'AUD', to: 'PEN', lat: '-12.04', lon: '-181' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Longitude: -181 is out of bounds");
  });

  it('should return 400 with empty coordinate', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'AUD', to: 'PEN', lat: '', lon: '-77.02' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Parameter 'lat' must not be empty");
  });

  it('should return 400 with non-numeric Latitude', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'AUD', to: 'PEN', lat: 'ABC', lon: '-77.02' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Invalid latitude: 'ABC'. Must be a number");
  });

  it('should return 400 with non-numeric Longitude', async () => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'AUD', to: 'PEN', lat: '-12.04', lon: 'XXX' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Invalid longitude: 'XXX'. Must be a number");
  });

  it.each([
    ['double quotes', '""'],
    ['question mark', '?'],
    ['slash', '/'],
    ['asterisk', '*'],
    ['percent sign', '%'],
  ])('should reject %s (%j) in longitude', async ( _label, badValue ) => {
    const res = await request(app)
      .get('/trip')
      .query({ from: 'AUD', to: 'PEN', lat: '-12.04', lon: badValue });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain(badValue);
  });

});

const request = require('supertest');
const { app, currenciesReady } = require('../server');

describe('GET /currencies', () => {

  beforeAll(async () => {
    await currenciesReady;
  });
  
  it("returns the full enriched catalog when no filter is given", async () => {
    const res = await request(app)
      .get("/currencies");

    expect(res.status).toBe(200);

    // Form: non-empty array with consistent metadata
    expect(Array.isArray(res.body.currencies)).toBe(true);
    expect(res.body.currencies.length).toBeGreaterThan(0);
    expect(res.body.count).toBe(res.body.currencies.length);

    // Structure: every entry fulfills the enriched contract
    for (const c of res.body.currencies) {
      expect(c).toHaveProperty("iso_code");
      expect(c).toHaveProperty("name");
    }

    // Content: spot-check known currencies
    const codes = res.body.currencies.map((c) => c.iso_code);
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
  });

  it.each([
    ['Colombian pesos', 'COP'],
    ['American Dollar', 'USD'],
    ['Euro', 'EUR'],
  ])('finds %s when searching its ISO code %s', async ( currencyLabel, currencyCode ) => {
      const res = await request(app)
        .get('/currencies')
        .query({ search: currencyCode });

      expect(res.status).toBe(200);
      expect(res.body.currencies.length).toBeGreaterThan(0);

      const needle = currencyCode.toLowerCase();
      const isRelated = (c) =>
        c.iso_code.toLowerCase().includes(needle) ||
          c.name.toLowerCase().includes(needle);
      
      expect(res.body.count).toBe(res.body.currencies.length);

  })

  it("matches search terms case-insensitively", async () => {
    const res = await request(app).get("/currencies").query({ search: "eUrO" });
    expect(res.status).toBe(200);
    expect(res.body.currencies.some((c) => c.iso_code === "EUR")).toBe(true);
  });
})

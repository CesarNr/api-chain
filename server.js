const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v2";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1"; 

/**
 * Currency codes supported by Frankfurter v2, loaded once at startup
 * and cached in memory. Contract (evidenced 2026-09-10): GET /v2/currencies
 * returns an ARRAY of objects, each with iso_code, iso_numeric, name,
 * symbol, start_date, end_date.
 */
let supportedCurrencies = null;

async function loadCurrencies() {
  try {
    const res = await fetch(`${FRANKFURTER_BASE}/currencies`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json(); // array of currency objects
    supportedCurrencies = data.map((c) => c.iso_code.toUpperCase());
    console.log(`Loaded ${supportedCurrencies.length} supported currencies`);
  } catch (err) {
    console.error("Could not load currency catalog", err.message);
    // Left null on purpose: /health will report this as degraded.
  }
}

const currenciesReady = loadCurrencies();

const isSupported = (code) => 
  typeof code === "string" &&
    supportedCurrencies !== null &&
    supportedCurrencies.includes(code.toUpperCase());

app.get("/health", async (req, res) => {
  const checks= { currencyCatalogLoaded: supportedCurrencies !== null };

  try {
    const res = await fetch(`${FRANKFURTER_BASE}/rate/USD/EUR`);
    checks.frankfurterApi = res.ok;
  } catch {
    checks.frankfurterApi = false;
  }
  
  const healthy = Object.values(checks).every(Boolean);
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    checks,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get("/exchange", async (req, res) => {
  const { from = "USD", to = "EUR" } = req.query;
  
  if (!isSupported(from) || !isSupported(to)) {
    return res.status(400).json({
      error: `Unsupported currency code. Supported codes: ${supportedCurrencies.slice(0, 10).join(", ")}...`,
    });
  }

  try {
    const response = await fetch(
      `${FRANKFURTER_BASE}/rates?base=${from.toUpperCase()}&quotes=${to.toUpperCase()}`
    );
    if (!response.ok) {
    return res.status(502).json({ error: `Currency API responded ${response.status}` });
    }

    // v2 contract: array of quotes; we requested exactly one, take the first
    const quote = (await response.json())[0];
    if (!quote) {
      return res.status(502).json({ error: "Currency API returned no data" });
    }

    res.json({
      date: quote.date,
      base: quote.base,
      quote: quote.quote,
      rate: quote.rate,
      source: "frankfurter.dev/v2",
    });
  } catch {
    res.status(502).json({ error: "Could not reach currency API" });
  }
});

/**
 * The chain: combines BOTH upstream APIs into one response —
 * the exchange rate for the destination currency AND the current
 * weather at the given coordinates.
 */
app.get("/trip", async (req,res) => {
  const { from = "USD", to = "EUR", lat = "52.52", lon = "13.41" } = req.query;

  if (!isSupported(from) || !isSupported(to)) {
    return res.status(400).json({ error: "Unsupported currency code" });
  }

  try {
    // Leg 1: exchange rate (Frankfurter v2)
    const fxRes = await fetch(
      `${FRANKFURTER_BASE}/rates?base=${from.toUpperCase()}&quotes=${to.toUpperCase()}`
    );
    if (!fxRes.ok) {
      return res.status(502).json({ error: "Currency API unavailable." });
    }
    const quote = (await fxRes.json())[0];
    if (!quote) {
      return res.status(502).json({ error: "Currency API returned no data."});
    }

    // Leg 2: current weather at destination (defaults: Berlin)
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
    );
    if (!wxRes.ok) {
      return res.status(502).json({ error: "Weather API unavailable"});
    }
    const wx = await wxRes.json();

    // The chain, complete: both services combined into one answer
    res.json({
      trip: { from: quote.base, to: quote.quote, lat: Number(lat), lon: Number(lon) },
      exchange: { date: quote.date, rate: quote.rate },
      weather: {
        temperatureC: wx.current?.temperature_2m,
        weatherCode: wx.current?.weather_code,
      },
    });
  } catch {
    res.status(502).json({ error: "Upstream dependency failed" });
  }
});

// Export the app for testing; start the server only when run as a script.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`api-chain listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, currenciesReady };



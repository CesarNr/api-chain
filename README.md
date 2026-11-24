# api-chain 🔗
  [![CI](https://github.com/CesarNr/api-chain/actions/workflows/ci.yml/badge.svg)](https://github.com/CesarNr/api-chain/actions/workflows/ci.yml)

A small Node.js service that chains public APIs: calls one, validates the response, and feeds data into the next, a mini service orchestrator, built with its own automated test suite (Jest + Supertest).

**Status:** 🚧 Work in progress - rebuilt as a portfolio project.

## Goals
- Build a REST service with Express
- Chain 2-3 public APIs into one useful response
- Automated testing (Jest + Supertest)
- CI with GitHub Actions

## Getting Started

### Prerequisites
- Node.js >= 18 (native `fetch` support).
- `npm` (bundled with Node.js).
- (optional) `jq` for pretty-printing JSON responses in manual tests.

### Installation
With Node.js installed, clone the repository and install its dependencies:
```bash
git clone https://github.com/CesarNr/api-chain.git
cd api-chain
npm install
```
Expected output: Project cloned to the local environment and all dependencies installed: Express, Jest, Supertest

### Running the server
```bash
npm start
```

Expected output in terminal:
```bash
api-chain listening on http://localhost:3000
Loaded 165 supported currencies
```
Note: number of supported currencies may vary, value is illustrative.

### Available endpoints

1. `/health`, reports the current status of the service and its upstream dependencies (Frankfurter and Open-Meteo). Each check returns `ok` with its latency in ms; `currencyCatalogLoaded` confirms the currency catalog was fetched at startup, all other endpoints depend on it.
   Useful to check before running the manual test battery, or after a failure, to confirm whether the problem is local or upstream. Returns `200` with `"status": "ok"` when everything is healthy, or `503` with `"status": "degraded"` when any check fails.

```bash
curl -s http://localhost:3000/health | jq
```

Expected output (values are illustrative):
```bash
{
  "status": "ok",
  "uptimeSeconds": 147,
  "checks": {
    "currencyCatalogLoaded": {
      "ok": true
    },
    "frankfurterApi": {
      "ok": true,
      "latencyMs": 211
    },
    "openMeteoApi": {
      "ok": true,
      "latencyMs": 318
    }
  },
  "totalLatencyMs": 320
}
```

Example of a degraded response (HTTP 503), in this case Frankfurter is unreachable, so `/exchange`, `/trip`, `/currencies` would fail even though the service itself is running:

```bash
{
  "status": "degraded",
  "uptimeSeconds": 2,
  "checks": {
    "currencyCatalogLoaded": {
      "ok": true
    },
    "frankfurterApi": {
      "ok": false,
      "message": "Frankfurter network error",
      "latencyMs": 1
    },
    "openMeteoApi": {
      "ok": true,
      "latencyMs": 0
    }
  },
  "totalLatencyMs": 1
}
```
Note: captured from the fault-injection test suite, where upstreams are mocked, hence the near-zero latencies.

2. `/exchange`, return exchange rate given two currencies (USD to EUR by default if no parameters are specified in HTTP query). Currency codes follow the ISO 4217 standard.

```bash
curl -s "http://localhost:3000/exchange" | jq
```
or
```bash
curl -s "http://localhost:3000/exchange?from=USD&to=COP" | jq
```

Expected result (values are illustrative - rates change daily):
```bash
{
  "date": "2026-09-16",
  "base": "USD",
  "quote": "COP",
  "rate": 3107.74,
  "source": "frankfurter.dev/v2"
}
```

3. `/trip` given two currencies and a coordinate in the signed decimal standard format (WGS 84 / EPSG:4326) (e.g. -16.5, -68.15 for La Paz, Bolivia) you will receive the exchange rate and temperature of the coordinate. ({ from = "USD", to = "EUR", lat = "52.52", lon = "13.41" } by default if arguments not specified on the HTTP request).

```bash
curl -s "http://localhost:3000/trip?from=USD&to=COP&lat=4.60&lon=-74.08" | jq
```
or
```bash
curl -s "http://localhost:3000/trip" | jq
```

Expected output (values are illustrative - rates change daily):
```bash
{
  "trip": {
    "from": "USD",
    "to": "COP",
    "lat": 4.6,
    "lon": -74.08
  },
  "exchange": {
    "date": "2026-09-16",
    "rate": 3108.56
  },
  "weather": {
    "temperatureC": 13.4,
    "weatherCode": 1
  }
}
```


4. `/currencies` returns the full supported-currency catalog used by the service (source: Frankfurter v2). Each entry includes the ISO code and numeric code, name, symbol, type, and validity dates. Optional `?search=` filters by name or ISO code (case-insensitive).

```bash
curl -s "http://localhost:3000/currencies" | jq '.count'
```
Expected output (catalog contents may change with the upstream source):
```bash
200
```

```bash
curl -s "http://localhost:3000/currencies?search=usd" | jq '{ count, currencies }'
```
Expected output (catalog contents may change with the upstream source):
```bash
{
  "count": 3,
  "currencies": [
    {
      "iso_code": "USD",
      "iso_numeric": "840",
      "name": "United States Dollar",
      "symbol": "$",
      "type": "currency",
      "start_date": "1948-06-21",
      "end_date": "2026-11-24"
    },
    {
      "iso_code": "USDC",
      "iso_numeric": null,
      "name": "USD Coin",
      "symbol": "USDC",
      "type": "crypto",
      "start_date": "2018-09-28",
      "end_date": "2026-11-23"
    },
    {
      "iso_code": "USDT",
      "iso_numeric": null,
      "name": "Tether",
      "symbol": "USDT",
      "type": "crypto",
      "start_date": "2014-10-06",
      "end_date": "2026-11-23"
    }
  ]
}
```
Note: /currencies is intentionally an exploratory endpoint: breadth of matches is a feature, not a defect. Searching "USD" returning USD, USDC and USDT gives discoverability.

### Running the automated test suite
```bash
npm test
```

The full suite passes green (✔), and GitHub Actions runs it again on every push, so the CI badge at the top of this page always reflects the current state. Tests cover each endpoint at three levels:

- Integration (live upstream): real requests against Frankfurter and Open-Meteo, asserting status codes and response contracts.
- Input validation: bad currency codes, out-of-range coordinates, duplicated parameters, and non-whitelisted search input.
- Fault injection (mocked upstream): upstream failures simulated with a mocked fetch, covering unreachable APIs, empty responses, and invalid JSON. These verify that the service degrades gracefully with 502/503 responses instead of crashing.

### Manual API exploration
See [docs/testing-curl.md](docs/testing-curl.md) for the full curl battery covering positive, negative and upstream-failure scenarios per endpoint.


## Roadmap
- [x] Basic Express server with health endpoint
- [x] Integrate Frankfurter API
- [x] Integrate Open-Meteo API
- [x] Chain multiple APIs into single endpoint (/trip)
- [x] Input validation with allowlist patterns
- [x] Automated testing suite (Jest + Supertest)
  - [x] Unit tests for validation logic
  - [x] Integration tests against live upstreams (/health, /exchange, /trip, /currencies)
  - [x] Fault injection tests (mocked upstream failures) — /health, /exchange
  - [ ] Fault injection tests for /currencies (mocked upstream)
- [x] GitHub Actions CI pipeline
- [x] Degraded health monitoring with partial failure detection
- [x] Expose /currencies endpoint for input discovery
- [x] Add upstream timeouts to /exchange and /trip endpoints
- [x] Validate /currencies search input (types, whitelist, empty)
- [ ] Rate limiting for public endpoints
- [ ] Retry logic for transient upstream failures

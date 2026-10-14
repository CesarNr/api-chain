# api-chain 🔗
  [![CI](https://github.com/CesarNr/api-chain/actions/workflows/ci.yml/badge.svg)](https://github.com/CesarNr/api-chain/actions/workflows/ci.yml)

A small Node.js service that chains public APIs: calls one, validates the
response, and feeds data into the next — a mini service orchestrator,
built with its own automated test suite (Jest + Supertest).

**Status:** 🚧 Work in progress — rebuilt as a portfolio project.

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

### Verify it is alive
```bash
curl -s "http://localhost:3000/health" | jq
```

Expected output (values are illustrative — rates change daily):
```bash
{
  "status": "ok",
  "uptimeSeconds": 33,
  "checks": {
    "currencyCatalogLoaded": {
      "ok": true
    },
    "frankfurterApi": {
      "ok": true,
      "latencyMs": 840
    },
    "openMeteoApi": {
      "ok": true,
      "latencyMs": 1592
    }
  },
  "totalLatencyMs": 1594
}
```

### Available endpoints

1. `/exchange`, return exchange rate given two currencies (USD to EUR by default if no parameters are specified in HTTP query). Currency codes follow the ISO 4217 standard.

```bash
curl -s "http://localhost:3000/exchange" | jq
```
or
```bash
curl -s "http://localhost:3000/exchange?from=USD&to=COP" | jq
```

Expected result (values are illustrative — rates change daily):
```bash
{
  "date": "2026-09-16",
  "base": "USD",
  "quote": "COP",
  "rate": 3107.74,
  "source": "frankfurter.dev/v2"
}
```

2. `/trip` given two currencies and a coordinate in the signed decimal standard format (WGS 84 / EPSG:4326) (e.g. -16.5, -68.15 for La Paz, Bolivia) you will receive the exchange rate and temperature of the coordinate. ({ from = "USD", to = "EUR", lat = "52.52", lon = "13.41" } by default if arguments not specified on the HTTP request).

```bash
curl -s "http://localhost:3000/trip?from=USD&to=COP&lat=4.60&lon=-74.08" | jq
```
or
```bash
curl -s "http://localhost:3000/trip" | jq
```

Expected output (values are illustrative — rates change daily):
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

### Running the automated test suite
```bash
npm test
```

Expected tests output: all tests for /health and /exchange pass (green ✔).
```bash
 PASS  tests/health.test.js
  GET /health
    integration
      ✓ should return 200 if all checks pass (1055 ms)
    fault injection (mocked upstream)
      ✓ should return 503 when Frankfurter is down (15 ms)
      ✓ should return 503 when open-meteo is down (4 ms)
      ✓ should return 503 with all checks down when both upstreams fail (5 ms)

 PASS  tests/exchange.test.js
  GET /exchange
    integration (live upstream)
      ✓ should return 200 with valid currencies (524 ms)
      ✓ should apply defaults when no parameters given (99 ms)
      ✓ should support USD → COP (95 ms)
    input validation
      ✓ should return 400 for unsupported currency XXX (4 ms)
      ✓ should return 400 for empty currency code (3 ms)
      ✓ should reject duplicated from parameter (3 ms)
    fault injection (mocked upstream)
      ✓ should return 502 when Frankfurter is unreachable (7 ms)
      ✓ should return 502 when Frankfurter returns 200 with no data (7 ms)
      ✓ Should return 502 when Frankfurter returns invalid json (8 ms)

 PASS  tests/trip.test.js
  GET /trip
    ✓ should return 200 with valid input (1637 ms)
    ✓ should apply defaults when no parameters given (429 ms)
    ✓ should return 400 with invalid currency from (5 ms)
    ✓ should return 400 with empty currency to (3 ms)
    ✓ should return 400 with Out-of-range lat (3 ms)
    ✓ should return 400 with Out-of-range lon (4 ms)
    ✓ should return 400 with empty coordinate (3 ms)
    ✓ should return 400 with non-numeric Latitude (3 ms)
    ✓ should return 400 with non-numeric Longitude (2 ms)```


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
  - [x] Integration tests against live upstreams
  - [x] Fault injection tests (mocked upstream failures)
- [x] GitHub Actions CI pipeline
- [x] Degraded health monitoring with partial failure detection
- [ ] Expose /currencies endpoint for input discovery
- [ ] Add upstream timeouts to /exchange and /trip endpoints
- [ ] Retry logic for transient upstream failures

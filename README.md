# api-chain 🔗
  [![CI](https://github.com/CesarNr/api-chain/actions/workflows/ci.yml/badge.svg)](https://github.com/CesarNr/api-chain/actions/workflows/ci.yml)

A small Node.js service that chains public APIs: calls one, validates the
response, and feeds data into the next — a mini service orchestrator,
built with its own automated test suite.

**Status:** 🚧 Work in progress — rebuilt as a portfolio project.

## Goals
- Build a REST service with Express
- Chain 2-3 public APIs into one useful response
- Automated testing (Supertest / Playwright)
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
  "checks": {
    "currencyCatalogLoaded": true,
    "frankfurterApi": true
  },
  "uptimeSeconds": 155
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
    ✓ should return 200 if all checks pass
    ✓ should include uptime in seconds

 PASS  tests/exchange.test.js
  GET /exchange
    ✓ should return 200 with valid currencies
    ✓ should support USD → COP
    ✓ should return 400 for unsupported currency XXX
    ✓ should return 400 for empty currency code

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        2.488 s
Ran all test suites.
```


### Manual API exploration
See [docs/testing-curl.md](docs/testing-curl.md) for the full curl battery covering positive, negative and upstream-failure scenarios per endpoint.



## Roadmap
- [X] Basic Express server with a health endpoint
- [X] Integrate first public API
- [X] Migrate to Frankfurter v2 for wider currency coverage
- [X] Chain second API
- [X] Automated tests
- [X] GitHub Actions pipeline
- [ ] Extend test coverage to /trip endpoint
- [ ] Add input validation & error handling for /trip endpoint
- [ ] Expose /currencies endpoint for input discovery
- [ ] Add upstream timeouts (AbortSignal)

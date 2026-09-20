# QA Findings Log

A running log of defects, limitations and design findings discovered
while developing and testing api-chain. Each finding records the
discovery, its symptom, root cause and the action taken (or proposed).

---

## 2026-09-10

### 1. Outdated upstream URL — FIXED

- **Severity:** Critical
- **Found while:** Testing `GET /exchange` with valid parameters.
- **Symptom:** All requests to the currency API failed regardless of input.
- **Root cause:** The Frankfurter API migrated domains. The code called
  `api.frankfurter.app`, which no longer exists. The live host is
  `api.frankfurter.dev`.
- **Verification:** Reproduced against the external API directly with
  `curl`, ruling out an issue in our own service.
- **Action:** Fixed base URL in `server.js`. Lesson: third-party URLs
  are dependencies too — they rot and deserve health checks.

### 2. Unsupported currency code returns an opaque 404 (v1)

- **Severity:** Minor (design limitation)
- **Found while:** Testing `USD → COP` and invalid codes (`XXX`, empty).
- **Symptom:** External API (v1) returns `404 {"message": "not found"}`
  for currencies outside its catalog (~30 ECB currencies). Our service
  forwarded this raw error to clients with no explanation.
- **Root cause:** Frankfurter v1 only covers ~30 ECB currencies; COP is
  not among them.
- **Action:** Validate `from`/`to` against the provider's official
  currency catalog and return `400` with a clear message before calling
  the external API.

---

## 2026-09-11

### Finding #2 — RETESTED ON v2: RESOLVED

- Retested `USD → COP` after migrating to Frankfurter v2
  (`/v2/rates?base=USD&quotes=COP`).
- **Result:** `200` with `{date, base, quote, rate}`. COP is served by
  the v2 catalog.
- Validation now checks user input against the live catalog loaded at
  startup (`GET /v2/currencies`, field `iso_code`), cached in memory.

### 3. Catalog size: endpoint vs marketing discrepancy

- **Found while:** Counting catalog entries with `jq 'length'`.
- **Symptom:** Official site advertises ~201–205 currencies; the default
  `GET /v2/currencies` response contains **165**.
- **Hypothesis:** Published figure likely includes historical/legacy
  currencies excluded from the default response (the API exposes
  `start_date`/`end_date` per currency, suggesting a historical scope).
- **Status:** Open — candidate follow-up: read full spec for the
  historical scope parameter and close with root cause.

### 4. Error-code drift between API versions

- Frankfurter v1 answered `404` for unsupported currencies; v2 responds
  `422` for invalid codes (per docs).
- Same vendor, different contract per version. Mitigation: version
  pinned explicitly in the base URL; any non-2xx upstream response is
  treated as an upstream failure at the proxy layer (502).

### 5. v2 response contract differs from v1 — verified empirically

- **Found while:** Exploring v2 with `curl` + `jq` before refactoring.
- **Details:**
  - `GET /v2/currencies` returns an **array** of objects keyed by
    `iso_code` (not a map keyed by code, as in v1). Fields: `iso_code`,
    `iso_numeric`, `name`, `symbol`, `start_date`, `end_date`.
  - `GET /v2/rates` returns a **flat array** of quote objects
    (`{date, base, quote, rate}`), unlike v1's object with a `rates`
    map.
- **Impact:** Filters and parsers written against the v1 shape fail
  (e.g., `jq '.rates.COP'` → "Cannot index array with string").
- **Action:** Contract was evidenced before refactoring; parsing now
  takes `[0]` from the rates array and reads `iso_code` from the
  currency objects.
- **Lesson (twice learned):** never write code — not even one-line `jq`
  filters — against an assumed contract. Inspect `jq 'type'` and
  `jq '.[0]'` first.

### 6. Stale effective date on "latest" rates

- **Observed:** `/v2/rates` returns `date: 2026-09-09` (previous
  business day), not the current date — consistent with end-of-day
  publication cycles (~16:00 CET for ECB data).
- **Impact:** Cosmetic for now (we surface the date in our response),
  but relevant if freshness SLAs are ever asserted. Documented as
  expected behavior.

---
## 2026-09-15

### 7. Missing destructuring in test imports of `app` - FIXED
- **Severity**: Minor (Automation blocker)
- **Found while**: running `npm test`
- **Details**: `server.js` exports a package via `module.exports = { app, currenciesReady }`. However, `tests/exchange.test.js` and `tests/health.test.js` imported it as `const app = require('../server')`, which receives the whole wrapper object instead of the Express app. Supertest failed with `TypeError: app.address is not a function`.
- **Actions**: Updated both test files to `const { app, currenciesReady } = require('../server')` and added `beforeAll(async () => { await currenciesReady; })` to prevent the catalog race condition.

---
## 2026-09-21

### 8. Missing errors validation for /trip endpoint - PLANNED
- **Severity**: Medium (User Experience)
- **Found while**: Designing test cases for /trip automation
- **Details**: Unlike `/exchange` which validates currency codes against the catalog, `/trip` lacks explicit error handling for invalid coordinates or missing parameters. Current implementation may return generic errors instead of informative 400 responses.
- **Risk**: Poor developer experience for API consumers; harder debugging for clients
- **Action planned**: Implement coordinate range validation (lat: -90 to 90, lon: -180 to 180) and empty parameter checks before API calls.

### 9. Upstream returns 200 OK with empty body for empty coordinates - DOCUMENTED
- **Severity**: High (feeds /trip validation gap, finding #8)
- **Found while**: Exploring Open-Meteo behavior during /trip test design
- **Details**: Sending `latitude=&longitude=` (present but empty params) to Open-Meteo
  returns `HTTP 200 OK` with `Content-Type: application/json` but a completely
  empty body (0 bytes, verified with `wc -c`). This is a silent failure: clients
  checking only the status code would assume success.
- **Impact on api-chain**: If /trip forwards empty coordinates without validation,
  the server receives a 200 with no JSON, causing downstream parse errors
  (confusing 500s) far from the actual cause.
- **Actions**: Feeds the /trip input validation roadmap item; empty-parameter
  rejection must happen in api-chain before calling the upstream.

### 10. Upstream rejects special characters at WAF level; automation scoped to representative cases - DECISION
- **Severity**: Low (exploratory finding / test design decision)
- **Found while**: Exploring Open-Meteo behavior with malformed query parameters during /trip test design
- **Details**: During exploratory testing of the weather upstream, several special characters
  were sent in the latitude/longitude query parameters:
  - `""` (double quotes) → HTTP 403 Forbidden served by nginx (HTML body, not JSON)
  - `?`, `/`, ` `, `*`, `%` → other invalid characters catalogued during exploration
  The 403 comes from the upstream's reverse proxy / WAF layer, meaning the request
  never reaches the Open-Meteo application itself. This confirms the defense exists
  at the infrastructure level, outside api-chain's control.
- **Decision**: Input validation at this level is important, but automating an
  exhaustive battery of special-character cases would produce an oversized,
  low-value automated suite (fragile, slow, and testing mostly the upstream's WAF
  behavior rather than api-chain's own contract). Scope was therefore reduced to:
  1. Automate ONE representative case — double quotes (`lat=""` / `lon=""`) — to keep
     regression control over the rejection behavior of this class.
  2. Add proper input validation in server.js for /trip (reject non-numeric and
     out-of-range coordinates with 400 + descriptive error) so api-chain does not
     depend on the upstream's WAF to reject malformed input.



---
## Design findings / technical debt (backlog)

### 1. No retry or refresh mechanism for the startup catalog

- `loadCurrencies()` runs once at startup. If the provider is down at
  boot, `supportedCurrencies` stays `null` forever, degrading the whole
  service until restart.
- **Proposed action:** Add periodic refresh or lazy reload with retry /
  exponential backoff.

### 2. Misleading 400 message when catalog is unavailable

- When the catalog fails to load, `isSupported()` returns `false` for
  every code, and `/exchange` responds `400 "Unsupported currency
  code"` — but the real condition is "catalog not loaded" (internal
  degradation), not user error.
- **Proposed action:** Distinguish `503` (service degraded, catalog
  unavailable) from `400` (invalid user input) at the endpoint level.

### 3. No explicit timeout on upstream calls

- Node's native `fetch` has no general request timeout by default; a
  hung upstream can stall a request indefinitely.
- **Proposed action:** Add `AbortSignal.timeout(ms)` to upstream calls
  and treat timeouts as upstream failures (502).

---

*Maintained as part of the api-chain portfolio. New findings go at the
bottom of their date section; closed findings keep their full history.*

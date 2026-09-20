## Health Endpoint Test Scenarios

| Scenario | Input | Expected Result | Status |
|----------|-------|-----------------|--------|
| Happy path - 200 + status 'ok' + checks verified | N/A | 200 + ok + checks(true) | 🟢 Covered |
| Happy path - uptime in seconds | N/A | 200 | 🟢 Covered |
| Catalog load failure (degraded) | fetch mocked to reject | 503 + status "degraded" | 🔴 TODO |

## Exchange Endpoint Test Scenarios

| Scenario | Input | Expected Result | Status |
|----------|-------|-----------------|--------|
| Happy path - valid currencies | from=USD, to=EUR | 200 + rate | 🟢 Covered |
| Happy path - Support COP | from=USD, to=COP  | 200 + rate | 🟢 Covered |
| Unsupported currency | from=XXX, to=COP  | 400 + error msg | 🟢 Covered |
| Empty currency | from=, to=EUR  | 400 + msg | 🟢 Covered |


## Trip Endpoint Test Scenarios

| Scenario | Input | Expected Result | Status |
|----------|-------|-----------------|--------|
| Happy path - Valid coordinates | USD, EUR, lat=-16.5, lon=-68.15 | 200 + rate + temp | 🔴 TODO |
| Invalid currency | XXX, EUR, lat=..., lon=... | 400 + error | 🔴 TODO |
| Empty currency | from=, to=EUR | 400 + error | 🔴 TODO |
| Out-of-range latitude - Boundary | lat=200, lon=... | 400 + error | 🔴 TODO |
| Out-of-range longitude - Boundary | lat=..., lon=200 | 400 + error | 🔴 TODO |
| Empty coordinate - Presence | lat=, lon=90 |400 + error | 🔴 TODO |
| Non-numeric latitude - Type | lat=ABC, lon=-64.15 | 400 + error | 🔴 TODO |
| Non-numeric longitude - Type | lat=-16.5, lon=XXX | 400 + error | 🔴 TODO |
| Invalid chars | lat="", lon"" | 400 + error | 🔴 TODO |
| Duplicated lat parameter - Cardinality | lat=-16.5&lat=4.6, lon=-74.08 | 400 + error (reject array-like input) | 🔴 TODO |
| Partial chain failure - weather upstream down (currency OK) | fetch mocked: weather rejects, rates OK | 502 + error indicating failed stage | 🔴 TODO |
| Upstream failure | Simulated API fail | 502 + degrade | 🔴 TODO |

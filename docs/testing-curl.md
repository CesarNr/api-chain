## Frankfurter curl tests 
¿type of structure?
```bash
curl -s "https://api.frankfurter.dev/v2/currencies" | jq 'type'
```

First element of the array:
```bash
curl -s "https://api.frankfurter.dev/v2/currencies" | jq '.[0]'
```

Return all keys:
```bash
curl -s "https://api.frankfurter.dev/v2/currencies" | jq '.[0] | keys'
```

Is USD in the array?:
```bash
curl -s "https://api.frankfurter.dev/v2/currencies" | jq '[.[] | select(.iso_code == "USD")] | length'
```

How many currencies:
```bash
curl -s "https://api.frankfurter.dev/v2/currencies" | jq 'length'
```



## open-meteo curl test
Happy path - valid coordinates
``` bash
curl -s 'https://api.open-meteo.com/v1/forecast?latitude=-16.5&longitude=-68.15&current=temperature_2m,weather_code' | jq
```

Out-of-range latitude - Boundary
```bash
curl -s 'https://api.open-meteo.com/v1/forecast?latitude=200&longitude=-68.15&current=temperature_2m,weather_code' | jq
```

Response:
``` bash
{
  "reason": "Latitude must be in range of -90 to 90°. Given: 200.0.",
  "error": true
}
```

Out-of-range longitude - Boundary
```bash
curl -s 'https://api.open-meteo.com/v1/forecast?latitude=-16.5&longitude=200&current=temperature_2m,weather_code' | jq
```

Response:
```bash
{
  "reason": "Longitude must be in range of -180 to 180°. Given: -200.0.",
  "error": true
}
```

Empty coordinates
```bash
curl -i 'https://api.open-meteo.com/v1/forecast?latitude=&longitude=&current=temperature_2m'
```

Response (silent failure):
```bash
HTTP/1.1 200 OK
Date: Sun, 20 Sep 2026 19:17:23 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
```



# API-chain curl tests

Only HTTP
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/health
```

Health jq
``` bash
curl -s http://localhost:3000/health | jq
```

Should return 200 with valid currencies
```bash
curl -s "http://localhost:3000/exchange?from=USD&to=EUR" | jq
```

Should return 200 with valid currencies COP
```bash
curl -s "http://localhost:3000/exchange?from=USD&to=COP" | jq
```

Should return 400 - Verify response headers and status -i
```bash
curl -i "http://localhost:3000/exchange?from=XXX&to=EUR"
```

### Trip Manual test
Trip | 200 manual input
```bash
curl -s "http://localhost:3000/trip?from=USD&to=COP&lat=4.60&lon=-74.08" | jq
```
Trip | default values
curl -s "http://localhost:3000/trip | jq

Trip | 400 | Invalid currency from
curl -s "http://localhost:3000/trip?from=AsD&to=COP&lat=4.60&lon=-74.08" | jq

Trip | 400 | Empty currency to
curl -s "http://localhost:3000/trip?from=USD&to=&lat=4.60&lon=-74.08" | jq


# App imported, not listening: function
```bash
node -e "const {app} = require('./server'); console.log('App imported, not listening:', typeof app.listen)"
```



# Automated Tests
These tests mirror the manual curls but run automatically on every commit.

Run the full test suite:
```bash
npm test
```

Watch mode for rapid development:
```bash
npm test -- --watch
```

Single test file:
```bash
npm test tests/exchange.test.js
```


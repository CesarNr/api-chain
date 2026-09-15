# Frankfurter curl tests 
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

# open-meteo curl test
EUR coordinate - happy path
``` bash
curl -s 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperaterature_2m,weather_code'
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

Trip with input
```bash
curl -s "http://localhost:3000/trip?from=USD&to=COP&lat=4.60&lon=-74.08" | jq

```

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


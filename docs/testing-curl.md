# ¿type of structure?
curl -s "https://api.frankfurter.dev/v2/currencies" | jq 'type'

# First element of the array:
curl -s "https://api.frankfurter.dev/v2/currencies" | jq '.[0]'

# return all keys:
curl -s "https://api.frankfurter.dev/v2/currencies" | jq '.[0] | keys'

# is USD in the array?:
curl -s "https://api.frankfurter.dev/v2/currencies" | jq '[.[] | select(.iso_code == "USD")] | length'

# How many currencies:
curl -s "https://api.frankfurter.dev/v2/currencies" | jq 'length'


# only HTTP :
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/health

# Weather
curl -s 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperaterature_2m,weather_code'

# Health
curl -s http://localhost:3000/health | jq

# Exchange standart input
curl -s "http://localhost:3000/exchange?from=USD&to=EUR" | jq

# Exchange another input
curl -s "http://localhost:3000/exchange?from=USD&to=COP" | jq

# Exchange with bad input
curl -i "http://localhost:3000/exchange?from=XXX&to=EUR"

# Trip with input
curl -s "http://localhost:3000/trip?from=USD&to=COP&lat=4.71&lon=-74.07" | jq

# App imported, not listening: function
node -e "const {app} = require('./server'); console.log('App imported, not listening:', typeof app.listen)"

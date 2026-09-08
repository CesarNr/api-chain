const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/exchange", async (req, res) => {
  const { from = "USD", to = "EUR" } = req.query;

  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?from=${from}&to=${to}`);
  
    if (!response.ok) {
    return res.status(502).json({ error: "Currency API unavailable" });
    }

    const data = await response.json();

    res.json({
      base: data.base,
      date: data.date,
      rates: data.rates,
      source: "frankfurter.app",
    });
  }
  catch (err) {
    res.status(502).json({ error: "Could not reach currency API" });
  }

});


app.listen(PORT, () => {
  console.log(`api-chain listening on http://localhost:${PORT}`);
});

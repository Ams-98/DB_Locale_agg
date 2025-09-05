const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const routes = require("./routes");

const app = express();

// Middlewares di base
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Log richieste (configurabile con LOG_FORMAT=combined/dev)
app.use(morgan(process.env.LOG_FORMAT || "dev"));

// Static (se usi /public per asset)
app.use(express.static("public"));

// Healthcheck rapido
app.get("/healthz", (req, res) => res.status(200).json({ ok: true }));

// API
app.use("/api", routes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;

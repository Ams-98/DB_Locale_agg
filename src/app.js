const express = require("express");
const morgan = require("morgan");
const { notFound, errorHandler } = require("./middlewares/error");
const routes = require("./routes");

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev")); // log colorati richieste

// Rotte principali
app.use("/", routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

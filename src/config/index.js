require("dotenv").config();
const path = require("path");

const PORT = parseInt(process.env.PORT || "4000", 10);
const LOG_FORMAT = process.env.LOG_FORMAT || "dev";
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

module.exports = { PORT, LOG_FORMAT, CORS_ORIGIN, UPLOADS_DIR };

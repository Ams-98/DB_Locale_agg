const asyncHandler = require("../middlewares/async");

const healthCheck = asyncHandler(async (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = { healthCheck };

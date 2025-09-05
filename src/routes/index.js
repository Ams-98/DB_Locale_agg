const { Router } = require("express");
const router = Router();

// Esempio rotta di test
router.get("/hello", (req, res) => {
  res.json({ message: "hello" });
});

module.exports = router;

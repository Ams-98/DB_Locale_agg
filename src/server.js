require("dotenv").config();
const app = require("./app");

const PORT = parseInt(process.env.PORT || "4000", 10);
app.listen(PORT, () => {
  console.log(`?? Server pronto su http://localhost:${PORT}`);
});

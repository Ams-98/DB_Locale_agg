// chalk v5 è ESM, quindi serve import dinamico
let chalk;
(async () => {
  chalk = (await import("chalk")).default;
})();

const logger = {
  info: (msg) => console.log(chalk?.blue(`ℹ ${msg}`) || msg),
  success: (msg) => console.log(chalk?.green(`✅ ${msg}`) || msg),
  warn: (msg) => console.log(chalk?.yellow(`⚠ ${msg}`) || msg),
  error: (msg) => console.log(chalk?.red(`❌ ${msg}`) || msg),
};

module.exports = logger;

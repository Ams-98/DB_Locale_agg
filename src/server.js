import http from "http";
import app from "./app.js"; // supponendo che il tuo Express sia qui

const DEFAULT_PORT = process.env.PORT || 3000;

function startServer(port) {
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`🚀 Server pronto su http://127.0.0.1:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Porta ${port} occupata, provo la successiva...`);
      startServer(port + 1); // fallback automatico
    } else {
      console.error("Errore server:", err);
    }
  });
}

startServer(Number(DEFAULT_PORT));


setInterval(() => {
  console.log("❤️ alive at", new Date().toISOString());
}, 5000);

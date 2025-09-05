// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
const fs = require("fs");
require("dotenv").config();

dayjs.extend(duration);

const app = express();
const prisma = new PrismaClient();

// --- Config ---
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000; // ✅ default 3000
const HOST = process.env.HOST || "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET || "supersegreto"; // ⚠️ in produzione usare variabili env

// --- Logging ---
function getLogFile() {
  const date = new Date().toISOString().split("T")[0];
  return path.join(__dirname, `server-${date}.log`);
}

function writeLog(message) {
  const logLine = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(getLogFile(), logLine);
  console.log(message);
}

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  writeLog(`${req.method} ${req.originalUrl} da ${req.ip}`);
  next();
});

// Static
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Multer ---
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// --- Utils ---
function calculateAge(birthDate) {
  const now = dayjs();
  const dob = dayjs(birthDate);
  const years = now.diff(dob, "year");
  const months = now.diff(dob.add(years, "year"), "month");
  const days = now.diff(dob.add(years, "year").add(months, "month"), "day");
  return `${years} anni, ${months} mesi, ${days} giorni`;
}

function buildFileUrl(req, filename) {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

// --- Auth middlewares ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Token mancante" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    writeLog("❌ Tentativo accesso con token non valido");
    return res.status(401).json({ error: "Token non valido" });
  }
}

async function adminMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Non autenticato" });

  try {
    const utente = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!utente || utente.ruolo !== "admin") {
      writeLog(`⛔ Accesso negato utente ${req.user.id}`);
      return res.status(403).json({ error: "Accesso negato: non sei admin" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

/* --- ROUTES --- */
// Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Homepage
app.get("/", (req, res) => {
  res.send("✅ Server attivo e funzionante!");
});

// Registrazione
app.post("/register", upload.fields([{ name: "documento" }]), async (req, res, next) => {
  try {
    const { nome, cognome, email, password, telefono, sesso, dataNascita, citta, comune, tipo } = req.body;

    const userExist = await prisma.user.findUnique({ where: { email } });
    if (userExist) return res.status(400).json({ error: "Email già registrata." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const count = await prisma.user.count();
    const ruolo = count === 0 ? "admin" : "user";

    const nuovoUtente = await prisma.user.create({
      data: {
        nome,
        cognome,
        email,
        password: hashedPassword,
        telefono,
        sesso: sesso || null,
        dataNascita: dataNascita ? new Date(dataNascita) : null,
        citta,
        comune,
        tipo,
        ruolo,
        documento: req.files?.documento?.[0]?.filename || null,
        documentoVerificato: false,
      },
    });

    writeLog(`👤 Registrazione nuovo utente: ${nuovoUtente.email} (ruolo=${ruolo})`);
    res.json({ success: true, utente: { id: nuovoUtente.id, email: nuovoUtente.email, ruolo } });
  } catch (err) {
    next(err);
  }
});

// Login
app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const utente = await prisma.user.findUnique({ where: { email } });
    if (!utente) return res.status(401).json({ error: "Credenziali non valide." });

    const valid = await bcrypt.compare(password, utente.password);
    if (!valid) return res.status(401).json({ error: "Credenziali non valide." });

    const token = jwt.sign({ id: utente.id, email: utente.email }, JWT_SECRET, { expiresIn: "1h" });

    writeLog(`🔑 Login effettuato: ${utente.email}`);
    res.json({ success: true, token, utente: { id: utente.id, email: utente.email, ruolo: utente.ruolo } });
  } catch (err) {
    next(err);
  }
});

// Profilo
app.get("/profile", authMiddleware, async (req, res, next) => {
  try {
    const utente = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!utente) return res.status(404).json({ error: "Utente non trovato" });

    if (utente.tipo === "professionista" && !utente.documentoVerificato) {
      return res.status(403).json({
        error: "Documento non verificato",
        message: "Il tuo documento è in attesa di verifica. Riceverai una mail appena sarà approvato.",
      });
    }

    const eta = utente.dataNascita ? calculateAge(utente.dataNascita) : null;
    res.json({
      id: utente.id,
      email: utente.email,
      nome: utente.nome,
      cognome: utente.cognome,
      sesso: utente.sesso,
      eta,
      citta: utente.citta,
      comune: utente.comune,
      documento: buildFileUrl(req, utente.documento),
      fotoProfilo: buildFileUrl(req, utente.fotoProfilo),
    });
  } catch (err) {
    next(err);
  }
});

// Upload foto
app.post("/upload-photo", authMiddleware, upload.single("fotoProfilo"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Nessuna foto caricata" });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { fotoProfilo: req.file.filename },
    });

    res.json({ success: true, fotoProfilo: buildFileUrl(req, updatedUser.fotoProfilo) });
  } catch (err) {
    next(err);
  }
});

// Admin
app.get("/admin/users", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const utenti = await prisma.user.findMany({
      select: { id: true, nome: true, cognome: true, email: true, ruolo: true, documentoVerificato: true, createdAt: true },
    });
    res.json(utenti);
  } catch (err) {
    next(err);
  }
});

app.put("/admin/verify-document/:id", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stato } = req.body;
    const utente = await prisma.user.update({
      where: { id: Number(id) },
      data: { documentoVerificato: stato },
    });
    writeLog(`📄 Documento utente ${utente.email} verificato=${stato}`);
    res.json({ success: true, utente });
  } catch (err) {
    next(err);
  }
});

app.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

app.get("/admin/logs", authMiddleware, adminMiddleware, (req, res) => {
  const logFile = getLogFile();
  if (!fs.existsSync(logFile)) return res.status(404).json({ error: "Nessun log trovato" });
  res.download(logFile, path.basename(logFile));
});

// --- Middleware errori globali ---
app.use((err, req, res, next) => {
  console.error("❌ Errore:", err);
  writeLog(`❌ Errore interno: ${err.message}`);
  res.status(500).json({ error: "Errore interno del server" });
});

// --- Avvio server con auto-retry ---
function tryListen(port) {
  const server = app.listen(port, HOST, () => {
    writeLog(`🚀 Server attivo su http://${HOST}:${port}`);
    setInterval(() => writeLog("❤️ alive"), 5000);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Porta ${port} occupata, provo la successiva...`);
      server.close(() => tryListen(port + 1));
    } else {
      console.error("❌ Errore avvio server:", err);
      process.exit(1);
    }
  });
}

tryListen(PORT);

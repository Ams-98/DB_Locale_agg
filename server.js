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
const { exec } = require("child_process");

dayjs.extend(duration);

const app = express();
const prisma = new PrismaClient();
const PORT = 3000; // ✅ lavoriamo sempre su porta 3000
const JWT_SECRET = "supersegreto"; // ⚠️ in produzione usa env
const LOG_FILE = path.join(__dirname, "server.log");

// funzione helper per loggare su file
function writeLog(message) {
  const logLine = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  console.log(message);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// log ogni richiesta
app.use((req, res, next) => {
  writeLog(`${req.method} ${req.originalUrl} da ${req.ip}`);
  next();
});

// Serve i file statici del frontend (cartella public + uploads)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Multer per upload file (documento e fotoProfilo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Funzione per calcolare età
function calculateAge(birthDate) {
  const now = dayjs();
  const dob = dayjs(birthDate);
  const years = now.diff(dob, "year");
  const months = now.diff(dob.add(years, "year"), "month");
  const days = now.diff(dob.add(years, "year").add(months, "month"), "day");
  return `${years} anni, ${months} mesi, ${days} giorni`;
}

// Helper: costruisce URL completo per i file
function buildFileUrl(req, filename) {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

/* --- Middleware di autenticazione e autorizzazione --- */
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Token mancante" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
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
    console.error("Errore adminMiddleware:", err);
    res.status(500).json({ error: "Errore interno" });
  }
}

/* --- ROUTES --- */

// ✅ Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ✅ Homepage test
app.get("/", (req, res) => {
  res.send("✅ Server attivo e funzionante!");
});

// 🔹 Registrazione
app.post("/register", upload.fields([{ name: "documento" }]), async (req, res) => {
  try {
    const {
      nome,
      cognome,
      email,
      password,
      telefono,
      sesso,
      dataNascita,
      citta,
      comune,
      tipo,
    } = req.body;

    const userExist = await prisma.user.findUnique({ where: { email } });
    if (userExist) {
      return res.status(400).json({ error: "Email già registrata." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
        documento: req.files["documento"]
          ? req.files["documento"][0].filename
          : null,
        documentoVerificato: false,
      },
    });

    writeLog(`👤 Registrazione nuovo utente: ${nuovoUtente.email}`);
    res.json({
      success: true,
      utente: { id: nuovoUtente.id, email: nuovoUtente.email },
    });
  } catch (err) {
    console.error("Errore registrazione:", err);
    res.status(500).json({ error: "Errore durante la registrazione." });
  }
});

// 🔹 Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const utente = await prisma.user.findUnique({ where: { email } });
    if (!utente) {
      return res.status(401).json({ error: "Credenziali non valide." });
    }

    const valid = await bcrypt.compare(password, utente.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenziali non valide." });
    }

    const token = jwt.sign({ id: utente.id, email: utente.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    writeLog(`🔑 Login effettuato: ${utente.email}`);
    res.json({
      success: true,
      token,
      utente: { id: utente.id, email: utente.email },
    });
  } catch (err) {
    console.error("Errore login:", err);
    res.status(500).json({ error: "Errore durante il login." });
  }
});

// 🔹 Rotta protetta profilo
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const utente = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!utente) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    if (utente.tipo === "professionista" && !utente.documentoVerificato) {
      return res.status(403).json({
        error: "Documento non verificato",
        message:
          "Il tuo documento è in attesa di verifica. Riceverai una mail appena sarà approvato.",
      });
    }

    let eta = null;
    if (utente.dataNascita) {
      eta = calculateAge(utente.dataNascita);
    }

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
    res.status(401).json({ error: "Token non valido" });
  }
});

// 🔹 Upload/aggiornamento foto profilo
app.post("/upload-photo", authMiddleware, upload.single("fotoProfilo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nessuna foto caricata" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { fotoProfilo: req.file.filename },
    });

    res.json({
      success: true,
      fotoProfilo: buildFileUrl(req, updatedUser.fotoProfilo),
    });
  } catch (err) {
    console.error("Errore upload foto:", err);
    res.status(500).json({ error: "Errore durante il caricamento foto." });
  }
});

/* --- ROTTE ADMIN --- */

// Lista utenti (solo admin)
app.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const utenti = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        sesso: true,
        citta: true,
        comune: true,
        tipo: true,
        documento: true,
        documentoVerificato: true,
        ruolo: true,
        createdAt: true,
      },
    });
    res.json(utenti);
  } catch (err) {
    console.error("Errore lista utenti:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// Verifica documento utente (admin)
app.put("/admin/verify-document/:id", authMiddleware, adminMiddleware, async (req, res) => {
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
    console.error("Errore verifica documento:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// Servire admin.html solo agli admin
app.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

// Scaricare i log del server (solo admin)
app.get("/admin/logs", authMiddleware, adminMiddleware, (req, res) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.status(404).json({ error: "Nessun log trovato" });
  }
  res.download(LOG_FILE, "server.log", (err) => {
    if (err) {
      console.error("Errore download log:", err);
      res.status(500).json({ error: "Errore nel download del log" });
    }
  });
});

/* --- AVVIO SERVER con gestione porta e heartbeat --- */
function startServer() {
  const server = app.listen(PORT, "0.0.0.0", () => {
    writeLog(`🚀 Server completo attivo su http://localhost:${PORT}`);

    setInterval(() => {
      writeLog("❤️ alive");
    }, 5000);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Porta ${PORT} già in uso. Provo a liberarla...`);

      const killCmd =
        process.platform === "win32"
          ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT}') do taskkill /PID %a /F`
          : `lsof -ti :${PORT} | xargs kill -9`;

      exec(killCmd, (killErr) => {
        if (killErr) {
          console.error("❌ Errore nel liberare la porta:", killErr);
          process.exit(1);
        } else {
          console.log(`✅ Porta ${PORT} liberata. Riavvio server...`);
          setTimeout(startServer, 1500);
        }
      });
    } else {
      console.error("❌ Errore avvio server:", err);
    }
  });
}

startServer();

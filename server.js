const express = require("express");
const multer = require("multer");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
const JWT_SECRET = "supersegreto"; // ⚠️ in produzione usa variabili d’ambiente

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve i file statici del frontend (cartella public)
app.use(express.static(path.join(__dirname, "public")));

// Multer per upload file/documenti
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* --- ROUTES --- */

// 🔹 Registrazione
app.post("/register", upload.single("documento"), async (req, res) => {
  try {
    const {
      nome,
      cognome,
      email,
      password,
      telefono,
      eta,
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
        eta: eta ? parseInt(eta) : null,
        citta,
        comune,
        tipo,
        documento: req.file ? req.file.filename : null,
      },
    });

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

    // Genera token JWT
    const token = jwt.sign(
      { id: utente.id, email: utente.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

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

// 🔹 Rotta protetta (Dashboard/Profile)
app.get("/profile", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Token mancante" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const utente = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!utente) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({
      id: utente.id,
      email: utente.email,
      nome: utente.nome,
    });
  } catch (err) {
    res.status(401).json({ error: "Token non valido" });
  }
});

// Avvio server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});

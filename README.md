# 📌 Mini Database Project

Questo è un progetto **Node.js + Express + Prisma + SQLite** con frontend statico.  
Lo stiamo costruendo passo per passo per creare un sistema reale e sicuro ✅.

---

## 🚀 Setup del progetto

### 1️⃣ Clona o sposta la cartella del progetto
Se copi manualmente i file in un’altra directory, ricordati di non spostare `node_modules`.  
Per copiare senza `node_modules` usa:
```bash
robocopy Mini_database C:\Progetti\Mini_database /E /XD node_modules
```

### 2️⃣ Installa le dipendenze
```bash
npm install
```

### 3️⃣ Inizializza Prisma (solo la prima volta)
```bash
npx prisma init
```

Questo crea la cartella `prisma/` con `schema.prisma`.

### 4️⃣ Definisci il modello nel file `prisma/schema.prisma`
Esempio di modello usato:
```prisma
model Utente {
  id        Int     @id @default(autoincrement())
  nome      String
  tipo      String
  documento String?
}
```

### 5️⃣ Esegui la prima migrazione
```bash
npx prisma migrate dev --name init
```

Questo:
- Crea il DB SQLite (`dev.db`)
- Applica la migrazione
- Genera il client Prisma

### 6️⃣ Genera Prisma Client (se cambi schema)
```bash
npx prisma generate
```

### 7️⃣ Applica le migrazioni in un ambiente nuovo
Se sposti il progetto o resetti il DB:
```bash
npx prisma migrate deploy
```

---

## 🛠️ Script npm utili

- Avvio in modalità sviluppo (con nodemon):
```bash
npm run dev
```

- Avvio normale (senza nodemon):
```bash
npm start
```

- Setup rapido (installa dipendenze + genera Prisma + applica migrazioni):
```bash
npm run setup
```

---

## 🌍 Avvio server

Dopo aver lanciato:
```bash
npm run dev
```

Vedrai nel terminale:
```
🚀 Server attivo su http://localhost:3000
```

Ora:
- Backend API → [http://localhost:3000](http://localhost:3000)  
- Frontend statico → [http://localhost:3000/index.html](http://localhost:3000/index.html)

---

## 📂 Struttura del progetto

```
prova-backend/
│── prisma/             # Schema e migrazioni DB
│   └── schema.prisma
│── public/             # File statici frontend (HTML, CSS, JS)
│   └── index.html
│   └── style.css
│── uploads/            # Documenti caricati utenti/professionisti
│── server.js           # Server Express
│── package.json        # Configurazioni e script
│── .env                # Variabili ambiente
```

---

## ✅ Requisiti
- Node.js >= 18  
- npm >= 9  

---

## 🔑 Prossimi step
- Aggiungere autenticazione (JWT / OAuth con Google e Apple)  
- Migrare DB da SQLite → PostgreSQL in produzione  
- Migliorare sicurezza (validazione input, hashing password, ecc.)  

// decodeToken.js
const jwt = require("jsonwebtoken");

// Inserisci qui il tuo token JWT (tra le virgolette)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJsYXVyYUBleGFtcGxlLmNvbSIsImlhdCI6MTc1Njg2MjEzMiwiZXhwIjoxNzU2ODY1NzMyfQ.TLbABNh0to2KnjW4n1Ev0TDKv4U6TTI8JLN6OPHNiiw";

// Decodifica senza verificare la firma (solo lettura payload)
const decoded = jwt.decode(token, { complete: true });

if (!decoded) {
  console.error("❌ Token non valido o malformato.");
  process.exit(1);
}

console.log("🔎 Header JWT:");
console.log(decoded.header);

console.log("\n📦 Payload JWT:");
console.log(decoded.payload);

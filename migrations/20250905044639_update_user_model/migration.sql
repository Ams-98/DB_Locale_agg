/*
  Warnings:

  - You are about to drop the column `eta` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "sesso" TEXT,
    "dataNascita" DATETIME,
    "citta" TEXT,
    "comune" TEXT,
    "tipo" TEXT NOT NULL,
    "documento" TEXT,
    "documentoVerificato" BOOLEAN NOT NULL DEFAULT false,
    "fotoProfilo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerificata" BOOLEAN NOT NULL DEFAULT false,
    "ruolo" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("citta", "cognome", "comune", "createdAt", "documento", "email", "emailVerificata", "id", "isActive", "nome", "password", "ruolo", "telefono", "tipo", "updatedAt") SELECT "citta", "cognome", "comune", "createdAt", "documento", "email", "emailVerificata", "id", "isActive", "nome", "password", "ruolo", "telefono", "tipo", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

/*
  Warnings:

  - You are about to drop the `Utente` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Utente";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "eta" INTEGER,
    "citta" TEXT,
    "comune" TEXT,
    "tipo" TEXT NOT NULL,
    "documento" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerificata" BOOLEAN NOT NULL DEFAULT false,
    "ruolo" TEXT NOT NULL DEFAULT 'utente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Consenso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utenteId" INTEGER NOT NULL,
    "privacyPolicy" BOOLEAN NOT NULL,
    "cookiePolicy" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consenso_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utenteId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordReset_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utenteId" INTEGER NOT NULL,
    "messaggio" TEXT NOT NULL,
    "risposta" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chat_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

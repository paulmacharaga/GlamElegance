/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `staff` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "staff" ADD COLUMN "avatar" TEXT;
ALTER TABLE "staff" ADD COLUMN "googleId" TEXT;
ALTER TABLE "staff" ADD COLUMN "googleProfile" TEXT;

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "bookingId" TEXT,
    "feedbackId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_googleId_key" ON "staff"("googleId");

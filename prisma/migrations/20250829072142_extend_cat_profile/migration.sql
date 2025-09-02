-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "ageYears" INTEGER NOT NULL,
    "activity" TEXT NOT NULL DEFAULT 'NORMAL',
    "sex" TEXT NOT NULL DEFAULT '不明',
    "hairAmount" TEXT NOT NULL DEFAULT '普通',
    "size" TEXT NOT NULL DEFAULT '中型',
    "neutered" BOOLEAN NOT NULL DEFAULT false,
    "allergies" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Cat" ("activity", "ageYears", "allergies", "createdAt", "id", "name", "userId", "weightKg") SELECT "activity", "ageYears", "allergies", "createdAt", "id", "name", "userId", "weightKg" FROM "Cat";
DROP TABLE "Cat";
ALTER TABLE "new_Cat" RENAME TO "Cat";
CREATE INDEX "Cat_userId_idx" ON "Cat"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

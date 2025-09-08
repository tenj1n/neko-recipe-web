-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductVariant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "form" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lifeStage" TEXT,
    "flavor" TEXT NOT NULL DEFAULT '',
    "features" TEXT,
    "ingredients_text" TEXT NOT NULL DEFAULT '',
    "proteinMin" REAL,
    "fatMin" REAL,
    "fiberMax" REAL,
    "ashMax" REAL,
    "moistureMax" REAL,
    "kcalPer100g" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductVariant" ("ashMax", "createdAt", "fatMin", "features", "fiberMax", "flavor", "form", "id", "kcalPer100g", "label", "lifeStage", "moistureMax", "productId", "proteinMin", "updatedAt") SELECT "ashMax", "createdAt", "fatMin", "features", "fiberMax", "flavor", "form", "id", "kcalPer100g", "label", "lifeStage", "moistureMax", "productId", "proteinMin", "updatedAt" FROM "ProductVariant";
DROP TABLE "ProductVariant";
ALTER TABLE "new_ProductVariant" RENAME TO "ProductVariant";
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE UNIQUE INDEX "ProductVariant_productId_form_label_flavor_key" ON "ProductVariant"("productId", "form", "label", "flavor");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "form" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lifeStage" TEXT,
    "flavor" TEXT NOT NULL DEFAULT '',
    "features" TEXT,
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

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_form_label_flavor_key" ON "ProductVariant"("productId", "form", "label", "flavor");

/*
  Warnings:

  - A unique constraint covering the columns `[catId,date,slot]` on the table `Meal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Product_ingredients_text_idx";

-- DropIndex
DROP INDEX "Product_brand_idx";

-- DropIndex
DROP INDEX "Product_name_idx";

-- CreateTable
CREATE TABLE "StoolLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "catId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "color" TEXT,
    "amount" TEXT,
    "mucus" BOOLEAN,
    "blood" BOOLEAN,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoolLog_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Cat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MealItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mealId" INTEGER NOT NULL,
    "productVariantId" INTEGER,
    "productId" INTEGER,
    "name" TEXT,
    "kcal" REAL,
    "ingredientsText" TEXT,
    "source" TEXT,
    "grams" INTEGER NOT NULL,
    CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MealItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MealItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MealItem" ("grams", "id", "mealId", "productVariantId") SELECT "grams", "id", "mealId", "productVariantId" FROM "MealItem";
DROP TABLE "MealItem";
ALTER TABLE "new_MealItem" RENAME TO "MealItem";
CREATE INDEX "MealItem_productId_idx" ON "MealItem"("productId");
CREATE INDEX "MealItem_productVariantId_idx" ON "MealItem"("productVariantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StoolLog_catId_date_idx" ON "StoolLog"("catId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StoolLog_catId_date_key" ON "StoolLog"("catId", "date");

-- CreateIndex
CREATE INDEX "Meal_date_idx" ON "Meal"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_catId_date_slot_key" ON "Meal"("catId", "date", "slot");

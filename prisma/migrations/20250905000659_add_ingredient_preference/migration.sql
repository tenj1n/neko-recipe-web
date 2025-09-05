-- CreateTable
CREATE TABLE "IngredientPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IngredientPreference_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Cat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "cat_keyword_unique" ON "IngredientPreference"("catId", "keyword");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientPreference_catId_keyword_key" ON "IngredientPreference"("catId", "keyword");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_ingredients_text_idx" ON "Product"("ingredients_text");

-- CreateIndex
CREATE INDEX "ProductVariant_label_idx" ON "ProductVariant"("label");

-- CreateIndex
CREATE INDEX "ProductVariant_flavor_idx" ON "ProductVariant"("flavor");

-- CreateIndex
CREATE INDEX "ProductVariant_features_idx" ON "ProductVariant"("features");

-- CreateIndex
CREATE INDEX "ProductVariant_ingredients_text_idx" ON "ProductVariant"("ingredients_text");

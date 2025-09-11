// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    // Product upsert
    const p = await tx.product.upsert({
      where: { barcode: "5012345678900" },
      update: {
        name: "サンプルキャットフード",
        brand: "NEKO FOODS",
        image:
          "https://images.openfoodfacts.org/images/products/501/234/567/8900/front_en.50.400.jpg",
        ingredients_text: "チキン、米、コーン、ビタミン類、ミネラル類",
        source: "local",
      },
      create: {
        barcode: "5012345678900",
        name: "サンプルキャットフード",
        brand: "NEKO FOODS",
        image:
          "https://images.openfoodfacts.org/images/products/501/234/567/8900/front_en.50.400.jpg",
        ingredients_text: "チキン、米、コーン、ビタミン類、ミネラル類",
        source: "local",
      },
    });

    // 既存Variantを全削除（この商品のみ）
    await tx.productVariant.deleteMany({ where: { productId: p.id } });

    // 2件だけ追加
    await tx.productVariant.createMany({
      data: [
        {
          productId: p.id,
          form: "ドライ",
          label: "チキン味",
          flavor: "チキン",
          features: "室内猫ケア",
          ingredients_text:
            "チキン、米、コーン、油脂、ビタミン類、ミネラル類",
          proteinMin: 28,
          fatMin: 12,
          fiberMax: 4,
          ashMax: 9,
          moistureMax: 10,
          kcalPer100g: 380,
        },
        {
          productId: p.id,
          form: "ドライ",
          label: "フィッシュ味",
          flavor: "フィッシュ",
          features: "毛玉ケア",
          ingredients_text:
            "白身魚、米、セルロース、ビタミン類、ミネラル類",
          proteinMin: 30,
          fatMin: 11,
          fiberMax: 5,
          ashMax: 9,
          moistureMax: 10,
          kcalPer100g: 375,
        },
      ],
    });
  });

  console.log("✅ Seeded & reset variants for 5012345678900");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

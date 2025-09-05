import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      barcode: "4902201202109", // 例: 銀のスプーン（仮）
      name: "銀のスプーン 三ツ星グルメ（例）",
      brand: "ユニ・チャーム",
      ingredients_text:
        "穀類（とうもろこし、コーングルテン等）、肉類（チキン、ビーフ等）、油脂類、魚介類（フィッシュミール、かつお節等）",
      image: "",
      source: "local",
    },
    {
      barcode: "4902201202154", // 例: モンプチ
      name: "モンプチ プチリュクス（例）",
      brand: "ネスレ ピュリナ",
      ingredients_text:
        "魚介類（かつお、まぐろ等）、肉類（チキン等）、ビタミン類、ミネラル類",
      image: "",
      source: "local",
    },
    {
      barcode: "4901133612345", // 例: いなば CIAO
      name: "CIAO ちゅ〜る（例）",
      brand: "いなばペットフード",
      ingredients_text:
        "鶏肉、魚介類（かつお、まぐろ等）、糖類、増粘多糖類、ビタミンE",
      image: "",
      source: "local",
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: p,
      create: p,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

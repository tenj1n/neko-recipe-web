import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // 相対パス: src/app/api/products/[barcode]/route.ts から

export async function GET(_: Request, { params }: { params: { barcode: string } }) {
  const barcode = params.barcode?.trim();
  if (!barcode) return NextResponse.json({ error: "barcode required" }, { status: 400 });

  // 1) まずDBキャッシュ
  const hit = await prisma.product.findUnique({ where: { barcode } });
  if (hit) {
    return NextResponse.json({
      source: hit.source,
      barcode: hit.barcode,
      brand: hit.brand,
      name: hit.name,
      ingredients_text: hit.ingredients_text,
      image: hit.image,
      raw: null,
    });
  }

  // 2) 外部API（OFF/OPFF）
  const endpoints = [
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    `https://world.openpetfoodfacts.org/api/v2/product/${barcode}.json`,
  ];

  for (const url of endpoints) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      if (j?.status === 1 || j?.product) {
        const p = j.product;
        const data = {
          source: url.includes("openpetfoodfacts") ? "openpetfoodfacts" : "openfoodfacts",
          barcode,
          brand: p?.brands || "",
          name: p?.product_name || p?.generic_name || "",
          ingredients_text:
            p?.ingredients_text_jp || p?.ingredients_text_ja || p?.ingredients_text || "",
          image: p?.image_url || "",
        };

        // 3) 取得できたら保存（次回以降はDBヒット）
        await prisma.product.upsert({
          where: { barcode },
          create: { ...data },
          update: { ...data },
        });

        return NextResponse.json({ ...data, raw: p });
      }
    } catch {
      // 次のエンドポイントへ
    }
  }

  // 4) 見つからない
  return NextResponse.json({ error: "product not found", barcode }, { status: 404 });
}

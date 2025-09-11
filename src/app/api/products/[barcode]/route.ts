import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ barcode: string }> }
) {
  const { barcode: raw } = await ctx.params;
  const barcode = raw?.trim();
  if (!barcode)
    return NextResponse.json({ error: "barcode required" }, { status: 400 });

  // まず DB
  const hit = await prisma.product.findUnique({
    where: { barcode },
    include: { variants: { orderBy: { id: "asc" } } },
  });
  if (hit) {
    return NextResponse.json({
      source: hit.source,
      barcode: hit.barcode,
      brand: hit.brand,
      name: hit.name,
      ingredients_text: hit.ingredients_text,
      image: hit.image,
      variants: hit.variants,
      raw: null,
    });
  }

  // 外部API
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
          source: url.includes("openpetfoodfacts")
            ? "openpetfoodfacts"
            : "openfoodfacts",
          barcode,
          brand: p?.brands || "",
          name: p?.product_name || p?.generic_name || "",
          ingredients_text:
            p?.ingredients_text_jp ||
            p?.ingredients_text_ja ||
            p?.ingredients_text ||
            "",
          image: p?.image_url || "",
        };

        await prisma.product.upsert({
          where: { barcode },
          create: data,
          update: data,
        });

        return NextResponse.json({ ...data, raw: p });
      }
    } catch {
      // 次へ
    }
  }

  return NextResponse.json({ error: "product not found", barcode }, { status: 404 });
}

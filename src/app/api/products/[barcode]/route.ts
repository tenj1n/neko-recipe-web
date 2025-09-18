// src/app/api/products/[barcode]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ← プロジェクトの他ファイルに合わせて統一

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ barcode: string }> }
) {
  const { barcode: raw } = await ctx.params;
  const barcode = raw?.trim();
  if (!barcode) return NextResponse.json({ error: "barcode required" }, { status: 400 });

  // 1) まずDB
  const hit = await prisma.product.findUnique({
    where: { barcode },
    include: { variants: { orderBy: { id: "asc" } } },
  });
  if (hit) {
    return NextResponse.json({
      id: hit.id, // ← 追加
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

  // 2) 外部API
  const endpoints = [
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    `https://world.openpetfoodfacts.org/api/v2/product/${barcode}.json`,
  ];

  for (const url of endpoints) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      const p = j?.product;
      if (!(j?.status === 1 || p)) continue;

      const data = {
        source: url.includes("openpetfoodfacts") ? "openpetfoodfacts" : "openfoodfacts",
        barcode,
        brand: p?.brands || "",
        name: p?.product_name || p?.generic_name || "",
        ingredients_text:
          p?.ingredients_text_jp || p?.ingredients_text_ja || p?.ingredients_text || "",
        image: p?.image_url || "",
      };

      // Product upsert
      const saved = await prisma.product.upsert({
        where: { barcode },
        create: data,
        update: data,
      });

      // kcal/100g があれば Variant を upsert（自動計算で使う）
      const nutr = p?.nutriments || {};
      const kcal100 =
        Number(nutr["energy-kcal_100g"]) ||
        Number(nutr["energy-kcal_100g_serving"]) ||
        Number(nutr["energy-kcal_value"]) ||
        Number(nutr["energy-kcal"]) ||
        Number(nutr["energy_100g"]) ||
        undefined;

      if (kcal100 && !Number.isNaN(kcal100)) {
        const label = (p?.product_name || "default").slice(0, 120);
        await prisma.productVariant.upsert({
          where: {
            // @@unique([productId, form, label, flavor]) を利用
            productId_form_label_flavor: {
              productId: saved.id,
              form: "unknown",
              label,
              flavor: "",
            },
          },
          create: {
            productId: saved.id,
            form: "unknown",
            label,
            flavor: "",
            kcalPer100g: Number(kcal100),
          },
          update: {
            kcalPer100g: Number(kcal100),
          },
        });
      }

      // 返却（id と variants も含む）
      const withVariants = await prisma.product.findUnique({
        where: { id: saved.id },
        include: { variants: { orderBy: { id: "asc" } } },
      });

      return NextResponse.json(
        {
          id: withVariants!.id,
          source: data.source,
          barcode,
          brand: withVariants!.brand,
          name: withVariants!.name,
          ingredients_text: withVariants!.ingredients_text,
          image: withVariants!.image,
          variants: withVariants!.variants,
          raw: p,
        },
        { status: 200 }
      );
    } catch {
      // 次のエンドポイントへ
    }
  }

  return NextResponse.json({ error: "product not found", barcode }, { status: 404 });
}

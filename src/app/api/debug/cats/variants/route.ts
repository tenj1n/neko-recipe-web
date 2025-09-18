// src/app/api/debug/cat/variants/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/** GET /api/debug/variants?q=キーワード&limit=10 */
export async function GET(req: NextRequest) {
  // 動いているか可視化
  console.log("[variants] handler invoked");

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));

    const where = q
      ? {
          OR: [
            { label:  { contains: q } },
            { flavor: { contains: q } },
            { product: { name: { contains: q } } }, // ← include で product.name も検索
          ],
        }
      : {};

    const items = await prisma.productVariant.findMany({
      where,
      take: limit,
      orderBy: { id: "asc" },
      include: { product: true },
    });

    return NextResponse.json({
      ok: true,
      count: items.length,
      items: items.map(v => ({
        id: v.id,
        productId: v.productId,
        productName: v.product?.name ?? "",
        label: v.label,
        flavor: v.flavor,
        form: v.form,
        kcalPer100g: v.kcalPer100g,
        proteinMin: v.proteinMin,
        fatMin: v.fatMin,
        fiberMax: v.fiberMax,
        ashMax: v.ashMax,
        moistureMax: v.moistureMax,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}
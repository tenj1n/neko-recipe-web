// src/app/api/debug/variants/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * GET /api/debug/variants?q=キーワード&limit=10&offset=0
 * ProductVariant を簡易検索して、Meal 登録に使う id を返すデバッグ用API
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

    // 検索条件（label / flavor / product.name / 数字のみなら barcode も）
    const or: any[] = [];
    if (q) {
      or.push({ label: { contains: q } });
      or.push({ flavor: { contains: q } });
      or.push({ product: { name: { contains: q } } });
      if (/^\d+$/.test(q)) {
        or.push({ product: { barcode: q } });
      }
    }

    const variants = await prisma.productVariant.findMany({
      where: q ? { OR: or } : undefined,
      include: {
        product: { select: { id: true, name: true, brand: true, barcode: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: limit,
      skip: offset,
    });

    const items = variants.map(v => ({
      id: v.id, // ← MealItem.productVariantId に入れる整数
      productId: v.productId,
      productName: v.product?.name ?? "",
      brand: v.product?.brand ?? "",
      barcode: v.product?.barcode ?? "",
      label: v.label,
      flavor: v.flavor,
      form: v.form,
      kcalPer100g: v.kcalPer100g,
      proteinMin: v.proteinMin,
      fatMin: v.fatMin,
      fiberMax: v.fiberMax,
      ashMax: v.ashMax,
      moistureMax: v.moistureMax,
    }));

    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}

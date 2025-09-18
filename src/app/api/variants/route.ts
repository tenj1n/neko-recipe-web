// src/app/api/variants/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  const variants = await prisma.productVariant.findMany({
    where: q
      ? {
          OR: [
            { label: { contains: q } },
            { flavor: { contains: q } },
            { product: { name: { contains: q } } },
          ],
        }
      : undefined,
    include: { product: true },
    take: limit,
    orderBy: [{ productId: "asc" }, { id: "asc" }],
  });

  const list = variants.map(v => ({
    id: v.id,
    productName: v.product.name,
    label: v.label,
    form: v.form,
    flavor: v.flavor,
    kcalPer100g: v.kcalPer100g,
    proteinMin: v.proteinMin,
    fatMin: v.fatMin,
  }));

  return NextResponse.json({ ok: true, count: list.length, variants: list });
}

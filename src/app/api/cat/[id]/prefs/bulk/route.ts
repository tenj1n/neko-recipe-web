import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, IngredientLevel } from "@prisma/client";

const prisma =
  (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // Next 15: params は Promise
  if (!id) return NextResponse.json({ error: "cat id required" }, { status: 400 });

  const body = await req.json();
  const items: { keyword: string; level: IngredientLevel }[] =
    Array.isArray(body?.items) ? body.items : [];

  for (const it of items) {
    const keyword = (it.keyword || "").toLowerCase().trim();
    if (!keyword) continue;
    await prisma.ingredientPreference.upsert({
      where: { catId_keyword: { catId: id, keyword } },
      update: { level: it.level },
      create: { catId: id, keyword, level: it.level },
    });
  }

  return NextResponse.json({ ok: true });
}

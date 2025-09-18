// src/app/api/meals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveCatId } from "@/lib/activeCat.server";  // ← ここを .server に
import { parseDateInputToDate, startOfDayInJST } from "@/lib/time";
import { decideItemKcal } from "@/lib/kcal";

export const runtime = "nodejs";
type Slot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, slot, notes, items } = body as {
      date: string;
      slot: Slot;
      notes?: string;
      items: Array<{
        name?: string; grams: number; kcal?: number;
        productVariantId?: number | null; productId?: number | null;
        ingredientsText?: string | null; source?: string | null;
      }>;
    };
    if (!date || !slot) return NextResponse.json({ error: "date, slot are required" }, { status: 400 });

    const catId = await requireActiveCatId();
    const d = startOfDayInJST(parseDateInputToDate(date));

    const cooked = await Promise.all(
      (items ?? []).map(async (it) => ({
        name: it.name || null,
        grams: Number(it.grams) || 0,
        kcal: await decideItemKcal({
          kcal: it.kcal, grams: Number(it.grams) || 0,
          productVariantId: it.productVariantId ?? null, name: it.name ?? null,
        }),
        productVariantId: it.productVariantId ?? null,
        productId: it.productId ?? null,
        ingredientsText: it.ingredientsText ?? null,
        source: it.source ?? null,
      }))
    );

    const saved = await prisma.meal.upsert({
      where: { catId_date_slot: { catId, date: d, slot } },
      create: { catId, date: d, slot, notes: notes || null, items: { create: cooked } },
      update: { notes: notes || null, items: { deleteMany: {}, create: cooked } },
      include: { items: true },
    });

    return NextResponse.json({ ok: true, meal: saved });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "meal save failed" }, { status: 500 });
  }
}

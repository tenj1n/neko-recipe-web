// src/app/api/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveCatId } from "@/lib/activeCat.server";
import { parseDateInputToDate, startOfDayInJST } from "@/lib/time";

export const runtime = "nodejs";

function ymd(d: Date) {
  const z = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    if (!fromParam || !toParam)
      return NextResponse.json({ error: "from, to are required" }, { status: 400 });

    const catId = await requireActiveCatId();
    const from = startOfDayInJST(parseDateInputToDate(fromParam));
    const to = startOfDayInJST(parseDateInputToDate(toParam));

    const meals = await prisma.meal.findMany({
      where: { catId, date: { gte: from, lte: to } },
      orderBy: [{ date: "asc" }, { slot: "asc" }],
      include: { items: true },
    });
    const stools = await prisma.stoolLog.findMany({
      where: { catId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });

    // 記録がある日だけを map へ
    const map = new Map<string, any>();

    for (const m of meals) {
      const k = ymd(m.date);
      const day = map.get(k) ?? { dateYmd: k, slots: {} as any, stool: undefined as any, hasMeals: false, hasStool: false };
      const slot = (day.slots[m.slot] ??= { notes: "", items: [] as any[] });
      slot.notes = m.notes ?? "";
      slot.items = m.items;
      day.hasMeals = true;
      map.set(k, day);
    }

    for (const s of stools) {
      const k = ymd(s.date);
      const day = map.get(k) ?? { dateYmd: k, slots: {} as any, stool: undefined as any, hasMeals: false, hasStool: false };
      day.stool = {
        status: s.status,
        color: s.color ?? "",
        amount: s.amount ?? "",
        mucus: !!s.mucus,
        blood: !!s.blood,
        note: s.note ?? "",
      };
      day.hasStool = true;
      map.set(k, day);
    }

    // 記録ゼロ日は返さない
    const days = Array.from(map.values()).filter((d) => d.hasMeals || d.hasStool);

    return NextResponse.json({ days });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "calendar fetch failed" }, { status: 500 });
  }
}

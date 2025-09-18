// src/app/api/stool/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveCatId } from "@/lib/activeCat.server";
import { parseDateInputToDate, startOfDayInJST } from "@/lib/time";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, status, color, amount, mucus, blood, note } = body as {
      date: string; status?: string; color?: string; amount?: string;
      mucus?: boolean; blood?: boolean; note?: string;
    };
    if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

    const catId = await requireActiveCatId();
    const d = startOfDayInJST(parseDateInputToDate(date));

    const saved = await prisma.stoolLog.upsert({
      where: { catId_date: { catId, date: d } },
      create: { catId, date: d, status: (status as any) ?? "NONE", color, amount, mucus, blood, note },
      update: { status: (status as any) ?? "NONE", color, amount, mucus, blood, note },
    });

    return NextResponse.json({ ok: true, stool: saved });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "stool save failed" }, { status: 500 });
  }
}

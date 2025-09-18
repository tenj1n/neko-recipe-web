// src/app/api/nutrition/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveCatId } from "@/lib/activeCat.server";
import { parseDateInputToDate, startOfDayInJST } from "@/lib/time";
import { buildTargets, diffAgainstTargets, summarizeDay } from "@/lib/nutrition";
import type { Activity } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    if (!dateParam) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const catId = await requireActiveCatId();
    const date = startOfDayInJST(parseDateInputToDate(dateParam));

    const cat = await prisma.cat.findUnique({
      where: { id: catId },
      select: { id: true, name: true, weightKg: true, activity: true },
    });
    if (!cat) {
      return NextResponse.json({ error: "cat not found" }, { status: 404 });
    }

    const meals = await prisma.meal.findMany({
      where: { catId, date },
      include: { items: true },
      orderBy: { slot: "asc" },
    });

    // 集計
    const totals = summarizeDay(meals as any);
    const targets = buildTargets({
      weightKg: cat.weightKg as number,
      activity: cat.activity as Activity,
    });
    const diff = diffAgainstTargets(totals, targets);

    // 簡易説明（AI未使用フォールバック）
    let explanation: string | undefined;
    if (diff.kcal < 0) {
      explanation = `現在、${cat.name}さんは${Math.abs(diff.kcal)}kcalのカロリーが不足しています。`;
    } else if (diff.kcal > 0) {
      explanation = `現在、${cat.name}さんは目標より${diff.kcal}kcal多く摂取しています。`;
    }

    return NextResponse.json({
      cat: { id: cat.id, name: cat.name, weightKg: cat.weightKg, activity: cat.activity },
      date,
      totals,
      targets,
      diff,
      explanation,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "summary failed" }, { status: 500 });
  }
}

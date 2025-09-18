// src/app/api/intake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sumIntakeForCatDay } from "@/lib/intake";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const catId = searchParams.get("catId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!catId || !date) {
      return NextResponse.json(
        { error: "catId と date(YYYY-MM-DD) を指定してください" },
        { status: 400 }
      );
    }

    const totals = await sumIntakeForCatDay(catId, date);
    return NextResponse.json({ ok: true, catId, date, totals });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}

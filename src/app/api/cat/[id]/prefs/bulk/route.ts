import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const catId = params.id;
    const body = await req.json().catch(() => null);
    const items: { keyword: string; level: "OK" | "CAUTION" | "NG" }[] =
      body?.items ?? [];

    if (!catId || !Array.isArray(items)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    // まとめて upsert
    for (const it of items) {
      const keyword = String(it.keyword || "").toLowerCase().trim();
      if (!keyword) continue;

      await prisma.ingredientPreference.upsert({
        where: { catId_keyword: { catId, keyword } },
        create: { catId, keyword, level: it.level },
        update: { level: it.level },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

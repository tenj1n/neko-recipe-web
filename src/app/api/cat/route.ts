// src/app/api/cat/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** 猫一覧（id と name だけ）を返す。 */
export async function GET() {
  try {
    const cats = await prisma.cat.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ cats });
  } catch (e) {
    console.error(e);
    // 落ちてもUIが壊れないよう空配列
    return NextResponse.json({ cats: [] }, { status: 200 });
  }
}

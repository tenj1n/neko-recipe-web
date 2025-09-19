import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

/** 猫一覧（id と name だけ） */
export async function GET() {
  try {
    const cats = await prisma.cat.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ cats });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ cats: [] }, { status: 200 });
  }
}

/** 新規作成 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(auth);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const cat = await prisma.cat.create({
    data: {
      userId: me.id,
      name: String(body.name || "（名前未設定）"),
      weightKg: Number.isFinite(body.weightKg) ? Number(body.weightKg) : 0,
      ageYears: Number.isFinite(body.ageYears) ? Number(body.ageYears) : 0,
      activity: (body.activity as any) ?? "NORMAL",
      sex: body.sex ?? "不明",
      hairAmount: body.hairAmount ?? "普通",
      size: body.size ?? "中型",
      neutered: !!body.neutered,
      allergies: body.allergies ?? null,
      // avatarUrl は別APIで設定
    },
    select: { id: true, name: true },
  });
  return NextResponse.json({ id: cat.id, cat });
}

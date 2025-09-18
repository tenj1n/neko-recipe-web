// src/app/api/cat/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// 今は全猫を返す（右上スイッチャと同じ見え方に合わせる）
export async function GET() {
  const cats = await prisma.cat.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, weightKg: true, activity: true, sex: true },
  });
  return NextResponse.json({ cats }, { headers: { "Cache-Control": "no-store" } });
}

/* 将来的にログインユーザーの猫だけに絞るなら、上をこれに差し替え
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"; // 置き場所に合わせて調整

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ cats: [] });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  const cats = await prisma.cat.findMany({
    where: { userId: user?.id ?? "" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, weightKg: true, activity: true, sex: true },
  });

  return NextResponse.json({ cats }, { headers: { "Cache-Control": "no-store" } });
}
*/

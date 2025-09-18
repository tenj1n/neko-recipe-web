import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const cats = await prisma.cat.findMany({
    select: { id: true, name: true, weightKg: true, ageYears: true, activity: true },
    orderBy: { name: "asc" },
    take: 100,
  });
  return NextResponse.json({ ok: true, cats });
}

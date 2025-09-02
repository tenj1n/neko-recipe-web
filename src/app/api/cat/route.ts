// src/app/api/cat/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { auth } from "../auth/[...nextauth]/route"; // ← 相対パスに注意
import { catCreateSchema } from "@/lib/catSchema";

const prisma =
  (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

// GET: 自分の猫一覧
export async function GET() {
  const session = await getServerSession(auth);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json([], { status: 200 });

  const cats = await prisma.cat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cats);
}

// POST: 新規作成
export async function POST(req: Request) {
  const session = await getServerSession(auth);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  const json = await req.json();

  // 文字→数/真偽 変換（フォームから来る string 対策）
  const parsed = catCreateSchema.safeParse({
    ...json,
    weightKg: Number(json?.weightKg),
    ageYears: Number.parseInt(json?.ageYears),
    neutered:
      typeof json?.neutered === "boolean"
        ? json.neutered
        : json?.neutered === "true",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "入力が正しくありません" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const created = await prisma.cat.create({
    data: {
      userId: user.id,
      name: data.name,
      weightKg: data.weightKg,
      ageYears: data.ageYears,
      activity: data.activity,
      sex: data.sex,
      hairAmount: data.hairAmount,
      size: data.size,
      neutered: data.neutered,
      allergies: data.allergies,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

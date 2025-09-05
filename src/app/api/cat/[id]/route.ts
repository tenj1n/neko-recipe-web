// src/app/api/cat/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { auth } from "@/app/api/auth/[...nextauth]/route"; // 認証（あなたのプロジェクトの export 名に合わせて）

const prisma =
  (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

// 共通: セッションのユーザーID取得
async function getUserId() {
  const session = await getServerSession(auth);
  if (!session?.user?.email) return null;
  const u = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return u?.id ?? null;
}

// GET: 編集フォームの初期表示用
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cat = await prisma.cat.findFirst({
    where: { id: params.id, userId },
  });

  if (!cat) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json(cat);
}

// PUT: 更新
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updated = await prisma.cat.updateMany({
    where: { id: params.id, userId },
    data: {
      name: body.name,
      weightKg: body.weightKg,
      ageYears: body.ageYears,
      activity: body.activity, // "LOW" | "NORMAL" | "HIGH"
      sex: body.sex ?? null,
      hairAmount: body.hairAmount ?? null,
      size: body.size ?? null,
      neutered: !!body.neutered,
      allergies: body.allergies ?? null,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: 削除（一覧の「削除」ボタン用）
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await prisma.cat.deleteMany({
    where: { id: params.id, userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

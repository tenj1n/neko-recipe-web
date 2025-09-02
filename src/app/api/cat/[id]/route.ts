// src/app/api/cat/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { auth } from "../../auth/[...nextauth]/route"; // ← ../ の数が1個多い
import { catCreateSchema } from "@/lib/catSchema";

const prisma =
  (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

// 共通: セッションから userId を取得
async function getUserId() {
  const session = await getServerSession(auth);
  if (!session?.user?.email) return null;
  const u = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return u?.id ?? null;
}

// GET /api/cat/[id] : 1件取得
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cat = await prisma.cat.findFirst({
    where: { id: params.id, userId },
  });
  if (!cat) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json(cat);
}

// PUT /api/cat/[id] : 更新
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = catCreateSchema.partial().safeParse({
    ...json,
    // 必要なら変換ロジックを再利用
    weightKg: json?.weightKg !== undefined ? Number(json.weightKg) : undefined,
    ageYears:
      json?.ageYears !== undefined ? Number.parseInt(json.ageYears) : undefined,
    neutered:
      json?.neutered !== undefined
        ? typeof json.neutered === "boolean"
          ? json.neutered
          : json.neutered === "true"
        : undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "入力が正しくありません" },
      { status: 400 }
    );
  }

  const updated = await prisma.cat.updateMany({
    where: { id: params.id, userId },
    data: parsed.data,
  });
  if (updated.count === 0)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const cat = await prisma.cat.findUnique({ where: { id: params.id } });
  return NextResponse.json(cat);
}

// DELETE /api/cat/[id] : 削除
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await prisma.cat.deleteMany({
    where: { id: params.id, userId },
  });
  if (deleted.count === 0)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

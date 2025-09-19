// src/app/api/cat/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const prisma =
  (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

async function getUserId() {
  const session = await getServerSession(auth);
  if (!session?.user?.email) return null;
  const u = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return u?.id ?? null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const cat = await prisma.cat.findFirst({ where: { id, userId } });
  if (!cat) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(cat);
}

// ユーティリティ：数値にできなければ undefined（更新しない）
function toNumOrUndef(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
// ユーティリティ：空文字は undefined（更新しない）/ 文字はそのまま
function toStrOrUndef(v: any) {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}
// ユーティリティ：空文字は null（nullable カラム用）
function toNullableStr(v: any) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  try {
    const updated = await prisma.cat.updateMany({
      where: { id, userId },
      data: {
        // 基本項目：未指定は更新しない（undefined）
        name: toStrOrUndef(body.name),
        weightKg: toNumOrUndef(body.weightKg),
        ageYears: toNumOrUndef(body.ageYears),
        activity: toStrOrUndef(body.activity) as any, // "LOW" | "NORMAL" | "HIGH"

        // ★非NULLカラムは null を入れないこと！（undefined で「更新しない」）
        sex: toStrOrUndef(body.sex),
        hairAmount: toStrOrUndef(body.hairAmount),
        size: toStrOrUndef(body.size),

        neutered: typeof body.neutered === "boolean" ? body.neutered : undefined,

        // ★nullable は空文字を null に丸める
        allergies: toNullableStr(body.allergies),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[PUT /api/cat/[id]] update error:", e);
    // Prisma の詳細はサーバーログへ、クライアントには簡潔に返す
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const deleted = await prisma.cat.deleteMany({ where: { id, userId } });
  if (deleted.count === 0)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

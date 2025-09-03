// src/app/api/cat/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { auth } from "../../auth/[...nextauth]/route";
import { catCreateSchema } from "@/lib/catSchema";

const prisma = (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

async function getUserId() {
  const session = await getServerSession(auth);
  if (!session?.user?.email) return null;
  const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  return u?.id ?? null;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cat = await prisma.cat.findFirst({ where: { id: params.id, userId } });
  if (!cat) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(cat);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = catCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "入力が正しくありません" }, { status: 400 });
  }

  const updated = await prisma.cat.updateMany({
    where: { id: params.id, userId },
    data: parsed.data,
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await prisma.cat.deleteMany({ where: { id: params.id, userId } });
  if (deleted.count === 0) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

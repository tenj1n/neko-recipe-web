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

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  const updated = await prisma.cat.updateMany({
    where: { id, userId },
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

  if (updated.count === 0)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json({ ok: true });
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

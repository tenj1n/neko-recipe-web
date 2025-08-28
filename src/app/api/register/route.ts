// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";  // ← これだけ！
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma =
  (globalThis as any).__prisma ??
  new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "このメールは既に登録されています" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, password: hash } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 400 });
  }
}

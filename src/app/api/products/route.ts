//src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // 相対パス調整

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.barcode) return NextResponse.json({ error: "barcode required" }, { status: 400 });

  const payload = {
    barcode: String(body.barcode).trim(),
    name: String(body.name ?? ""),
    brand: String(body.brand ?? ""),
    ingredients_text: String(body.ingredients_text ?? ""),
    image: String(body.image ?? ""),
    source: "local" as const,
  };

  const saved = await prisma.product.upsert({
    where: { barcode: payload.barcode },
    create: payload,
    update: payload,
  });

  return NextResponse.json(saved, { status: 201 });
}

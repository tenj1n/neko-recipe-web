// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // 受取→バッファ化
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 拡張子推定（無ければ png）
  const ext =
    (file.type && file.type.split("/")[1]) ||
    (file.name?.split(".").pop() || "png");
  const filename = `${randomUUID()}.${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filepath = path.join(uploadsDir, filename);
  await writeFile(filepath, buffer);

  // /public 配下はそのまま配信できる
  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
}

// src/app/api/me/active-cat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const COOKIE_KEY = "activeCatId";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1年
};

// 現在のアクティブ猫を返す（CatSwitcher / useActiveCat 用）
export async function GET() {
  try {
    const jar = await cookies();
    const id = jar.get(COOKIE_KEY)?.value || null;
    if (!id) return NextResponse.json({ cat: null });

    const cat = await prisma.cat.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    return NextResponse.json({ cat: cat ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ cat: null }, { status: 200 });
  }
}

// アクティブ猫を変更する（CatSwitcher の「この猫にする」）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const catId = String(body?.catId || "").trim();
    if (!catId) {
      return NextResponse.json({ error: "catId is required" }, { status: 400 });
    }

    // 存在確認
    const cat = await prisma.cat.findUnique({
      where: { id: catId },
      select: { id: true, name: true },
    });
    if (!cat) {
      return NextResponse.json({ error: "cat not found" }, { status: 404 });
    }

    // ★ Cookie はレスポンス側にセットするのが確実
    const res = NextResponse.json({ ok: true, cat });
    res.cookies.set(COOKIE_KEY, catId, COOKIE_OPTS);
    return res;
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "failed to change active cat" },
      { status: 500 }
    );
  }
}

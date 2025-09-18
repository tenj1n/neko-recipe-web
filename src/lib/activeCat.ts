// src/lib/activeCat.ts
import "server-only";                   // ★サーバ専用に固定
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_KEY = "activeCatId";

/** Cookie からアクティブ猫IDを取得（なければ null） */
export async function getActiveCatId(): Promise<string | null> {
  const store = await cookies();        // ★ Next 15 は async
  return store.get(COOKIE_KEY)?.value ?? null;
}

/** アクティブ猫IDを必須取得（未設定/存在しない場合はエラー） */
export async function requireActiveCatId(): Promise<string> {
  const id = await getActiveCatId();
  if (!id) throw new Error("activeCatId cookie not set");
  const exists = await prisma.cat.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new Error("active cat not found");
  return id;
}

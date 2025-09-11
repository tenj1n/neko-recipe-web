"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { syncAllergiesToPrefs } from "@/lib/allergySync";

/** ヘッダーのセレクターから呼ぶ：選択した猫IDを Cookie に保存 */
export async function setActiveCat(catId: string) {
  const ck = await cookies();
  ck.set("activeCatId", catId, {
    path: "/",
    httpOnly: true,     // クライアントJSから触らない。サーバ側だけで読む
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** （任意）猫の登録/編集の保存時に、free-text→Preferenceへ同期も行う */
export async function saveCatAllergies(catId: string, allergiesText: string) {
  // Cat.allergies を保存している前提（あなたの既存の保存フローに合わせて呼び出し）
  await prisma.cat.update({ where: { id: catId }, data: { allergies: allergiesText } });
  await syncAllergiesToPrefs(catId, allergiesText);
}

// src/lib/kcal.ts
import { prisma } from "@/lib/prisma";

// 簡易の100gあたり推定テーブル（必要に応じて拡張してください）
const PER100G: Array<{ kw: RegExp; kcal: number }> = [
  { kw: /ささみ|鶏ささみ|ゆでささみ|鶏胸|むね/i, kcal: 110 },
  { kw: /鶏もも|もも肉/i, kcal: 200 },
  { kw: /まぐろ|マグロ|ツナ/i, kcal: 120 },
  { kw: /かつお|カツオ/i, kcal: 115 },
  { kw: /さけ|サーモン|鮭/i, kcal: 200 },
  { kw: /白身魚|タラ|スズキ/i, kcal: 90 },
  { kw: /ウェット|パウチ|缶/i, kcal: 80 },           // 一般的ウェット
  { kw: /ドライ|カリカリ|ドライフード/i, kcal: 350 }, // 一般的ドライ
  { kw: /ちゅ|チュ|ペースト|おやつ/i, kcal: 200 },
];

export async function kcalFromVariantOrNull(
  productVariantId: number | null | undefined,
  grams: number
): Promise<number | null> {
  if (!productVariantId || grams <= 0) return null;
  const v = await prisma.productVariant.findUnique({
    where: { id: productVariantId },
    select: { kcalPer100g: true },
  });
  if (!v?.kcalPer100g) return null;
  return Math.max(0, Math.round((v.kcalPer100g * grams) / 100));
}

export function estimateKcalByName(name: string | undefined | null, grams: number): number | null {
  if (!name || grams <= 0) return null;
  const hit = PER100G.find((r) => r.kw.test(name));
  if (!hit) return null;
  return Math.max(0, Math.round((hit.kcal * grams) / 100));
}

export async function decideItemKcal(draft: {
  kcal?: number | null;
  grams: number;
  productVariantId?: number | null;
  name?: string | null;
}): Promise<number> {
  if (typeof draft.kcal === "number" && !Number.isNaN(draft.kcal)) {
    return Math.max(0, Math.round(draft.kcal));
  }
  const v = await kcalFromVariantOrNull(draft.productVariantId, draft.grams);
  if (v != null) return v;
  const est = estimateKcalByName(draft.name, draft.grams);
  if (est != null) return est;
  // 最後の保険：ウェット80kcal/100g
  return Math.max(0, Math.round((80 * (draft.grams || 0)) / 100));
}

// 栄養の簡易計算＆目標値
import { Activity, Meal, ProductVariant } from "@prisma/client";

export type Totals = {
  kcal: number;
  protein_g?: number;
  fat_g?: number;
  fiber_g?: number;
};

export type Targets = {
  kcal: number;       // その日の目標kcal（MER）
  protein_g?: number; // 参考値（不明ならundefined）
  fat_g?: number;     // 参考値（不明ならundefined）
};

export function calcRERkg(weightKg: number) {
  // Resting Energy Requirement
  return 70 * Math.pow(weightKg, 0.75);
}

export function activityFactor(a: Activity) {
  // ざっくりな係数（成猫・去勢済み前提の目安）
  if (a === "LOW") return 1.2;
  if (a === "HIGH") return 1.6;
  return 1.4; // NORMAL
}

export function kcalFromVariant(variant: ProductVariant | null | undefined, grams: number, fallbackKcal?: number) {
  if (typeof fallbackKcal === "number") return fallbackKcal;
  const per100 = variant?.kcalPer100g;
  if (typeof per100 === "number") return (per100 * grams) / 100;
  return 0;
}

export function macroFromVariantPercent(percent: number | null | undefined, grams: number) {
  // 例: proteinMin=30(%) × 50g => 15g
  if (typeof percent !== "number") return undefined;
  return (percent / 100) * grams;
}

export function summarizeDay(meals: Array<Meal & { items: any[] }>): Totals {
  let kcal = 0;
  let protein_g: number | undefined;
  let fat_g: number | undefined;
  let fiber_g: number | undefined;

  for (const m of meals) {
    for (const it of m.items) {
      const grams: number = Number(it.grams) || 0;
      const v: ProductVariant | null = it.productVariant ?? null;

      // kcal
      kcal += kcalFromVariant(v, grams, typeof it.kcal === "number" ? it.kcal : undefined);

      // macros（%が入っていれば推定）
      const p = macroFromVariantPercent(v?.proteinMin ?? null, grams);
      const f = macroFromVariantPercent(v?.fatMin ?? null, grams);
      const fi = macroFromVariantPercent(v?.fiberMax ?? null, grams);

      protein_g = p != null ? (protein_g ?? 0) + p : protein_g;
      fat_g = f != null ? (fat_g ?? 0) + f : fat_g;
      fiber_g = fi != null ? (fiber_g ?? 0) + fi : fiber_g;
    }
  }
  return { kcal: Math.round(kcal), protein_g, fat_g, fiber_g };
}

export function buildTargets(params: { weightKg: number; activity: Activity }) : Targets {
  const rer = calcRERkg(params.weightKg);
  const kcal = Math.round(rer * activityFactor(params.activity));

  // タンパク質/脂質はざっくりの参考値（不足判定のヒント用）
  // 目安: たんぱく質 5.2g/kg体重/日, 脂質 2.0g/kg体重/日（シンプルな参考）
  const protein_g = Math.round(params.weightKg * 5.2 * 10) / 10;
  const fat_g = Math.round(params.weightKg * 2.0 * 10) / 10;

  return { kcal, protein_g, fat_g };
}

export function diffAgainstTargets(t: Totals, target: Targets) {
  return {
    kcal: t.kcal - target.kcal, // +過剰 / -不足
    protein_g: t.protein_g != null && target.protein_g != null ? t.protein_g - target.protein_g : undefined,
    fat_g: t.fat_g != null && target.fat_g != null ? t.fat_g - target.fat_g : undefined,
  };
}

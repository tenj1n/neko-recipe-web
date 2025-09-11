// src/lib/feeding.ts
import type { Activity } from "@prisma/client";

/** ライフステージ（AAFCOの区分を実務向けに簡約） */
export type LifeStage = "KITTEN" | "JUNIOR" | "PRIME" | "MATURE" | "SENIOR" | "GERIATRIC";
/** 性別（Cat.sex は自由文字列なので正規化する） */
export type Sex = "MALE" | "FEMALE" | "UNKNOWN";

/** 年齢(歳)→ライフステージ（ageYearsだけで切る簡易版） */
export function lifeStageFromAgeYears(ageYears: number): LifeStage {
  if (ageYears <= 0) return "KITTEN";   // 0歳=子猫
  if (ageYears <= 2) return "JUNIOR";   // 1–2歳
  if (ageYears <= 6) return "PRIME";    // 3–6歳
  if (ageYears <= 10) return "MATURE";  // 7–10歳
  if (ageYears <= 14) return "SENIOR";  // 11–14歳
  return "GERIATRIC";                   // 15歳+
}

export function lifeStageLabel(stage: LifeStage): string {
  switch (stage) {
    case "KITTEN": return "子猫";
    case "JUNIOR": return "ジュニア";
    case "PRIME": return "成猫(3–6歳)";
    case "MATURE": return "成猫(7–10歳)";
    case "SENIOR": return "シニア(11–14歳)";
    case "GERIATRIC": return "超高齢(15歳+)";
  }
}

/** Cat.sex を標準化（日本語・記号も吸収） */
export function normalizeSex(s: string | null | undefined): Sex {
  const t = (s ?? "").trim().toLowerCase();
  if (["male","m","♂","おす","オス"].includes(t)) return "MALE";
  if (["female","f","♀","めす","メス"].includes(t)) return "FEMALE";
  return "UNKNOWN";
}

/** RER: 70 * 体重^0.75 */
export function calcRER(weightKg: number) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return 0;
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * ライフステージ/性別/去勢/活動（＋任意: 妊娠・授乳）から係数を返す
 * 既定:
 *  - 子猫: 2.5×
 *  - 成猫: 去勢済 1.2× / 未手術は ♀1.3×・♂1.4×
 *  - シニア以降: 1.0× を起点（活動度で微調整）
 *  - 活動度: LOW -0.1 / HIGH +0.2（下限0.8）
 *  - 妊娠/授乳は♀のみ適用（必要時にフラグを渡す）
 */
export function merFactor({
  stage,
  sex,
  neutered,
  activity,
  pregnant,
  lactationWeek,
  kittensCount,
}: {
  stage: LifeStage;
  sex: Sex;
  neutered: boolean;
  activity: Activity;        // "LOW" | "MEDIUM" | "HIGH"
  pregnant?: boolean;
  lactationWeek?: number | null; // 授乳何週目（1..6 目安）
  kittensCount?: number | null;  // 子猫頭数（1..8 目安）
}): number {
  // 授乳（♀のみ）：週×頭数でざっくり増加
  if (sex === "FEMALE" && lactationWeek && lactationWeek > 0) {
    const n = Math.max(1, Math.min(8, Math.round(kittensCount ?? 3))); // 1..8頭
    const baseByWeek = [0, 1.3, 1.3, 1.45, 1.55, 1.65, 1.9]; // index=週(0..6) → 1..6週を想定
    const base = baseByWeek[Math.min(6, lactationWeek)];
    return base + 0.15 * (n - 1);
  }
  // 妊娠（♀のみ）
  if (sex === "FEMALE" && pregnant) return 1.8;

  // 子猫
  if (stage === "KITTEN") return 2.5;

  // シニア以降
  if (stage === "SENIOR" || stage === "GERIATRIC") {
    const actAdj = activity === "LOW" ? -0.1 : activity === "HIGH" ? +0.2 : 0;
    return Math.max(0.8, 1.0 + actAdj);
  }

  // 成猫（JUNIOR/PRIME/MATURE）
  let k = neutered ? 1.2 : (sex === "FEMALE" ? 1.3 : 1.4);
  const actAdj = activity === "LOW" ? -0.1 : activity === "HIGH" ? +0.2 : 0;
  return Math.max(0.8, k + actAdj);
}

/** MER: 係数 × RER（整数に丸め） */
export function calcMER(args: {
  weightKg: number;
  ageYears: number;
  sex?: string | Sex;
  activity: Activity;
  neutered: boolean;
  pregnant?: boolean;
  lactationWeek?: number | null;
  kittensCount?: number | null;
}) {
  const rer = calcRER(args.weightKg);
  const stage = lifeStageFromAgeYears(args.ageYears);
  const sx = normalizeSex(args.sex);
  const factor = merFactor({
    stage,
    sex: sx,
    neutered: args.neutered,
    activity: args.activity,
    pregnant: sx === "FEMALE" ? args.pregnant : false,
    lactationWeek: sx === "FEMALE" ? args.lactationWeek : null,
    kittensCount: sx === "FEMALE" ? args.kittensCount : null,
  });
  return Math.round(rer * factor);
}

/**
 * 1日量（g）を算出（kcal/100g から変換）
 * 例：dailyKcal=240, kcalPer100g=360 → (240*100)/360 = 66.6... ≒ 65g（5g刻み）
 */
export function calcDailyGrams({
  dailyKcal,
  kcalPer100g,
  roundTo = 5,
}: {
  dailyKcal: number;
  kcalPer100g?: number | null;
  roundTo?: number;
}) {
  if (!dailyKcal || !kcalPer100g) return null;
  const grams = (dailyKcal * 100) / kcalPer100g;
  const step = Math.max(1, roundTo);
  return Math.round(grams / step) * step;
}

// src/lib/nutrition.ts

/**
 * 解析側の最小栄養セット（合計値）
 * すべて「g」で統一（kcalのみkcal）
 */
export type Intake = {
  kcal: number;        // 1日の合計 kcal
  protein: number;     // g
  fat: number;         // g
  carbs: number;       // g
};

/**
 * 100gあたりの栄養成分（商品マスタ由来を想定）
 * 例：Open Pet Food Facts / 自前DB からの正規化結果
 */
export type Per100g = {
  kcalPer100g: number;
  protein_g?: number | null;
  fat_g?: number | null;
  carbs_g?: number | null;
};

/**
 * RER（安静時必要量）
 */
export function calcRER(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) throw new Error("体重は正の数で指定してください");
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * MER（1日必要量）
 * factor例：去勢済1.2 / 未去勢1.4 / 肥満1.0 など
 */
export function calcMER(rer: number, factor: number): number {
  return rer * factor;
}

/**
 * シンプルな係数（feeding.tsがある場合はそちら優先でもOK）
 */
export function simpleFactor({
  neutered,
  obese,
}: {
  neutered: boolean;
  obese?: boolean;
}) {
  if (obese) return 1.0;
  return neutered ? 1.2 : 1.4;
}

/**
 * 栄養ターゲット（目標）生成
 * - kcal は MER をそのまま
 * - マクロ配分は実務向けの「目安」をセット（アプリ内で後から調整可能）
 */
export function generateTargets(mer: number) {
  // 配分例：タンパク 30% / 脂質 25% / 炭水化物 45%
  return {
    kcal: mer,
    protein: (mer * 0.30) / 4, // g
    fat:     (mer * 0.25) / 9, // g
    carbs:   (mer * 0.45) / 4, // g
  };
}

/**
 * 単一アイテムの摂取栄養を計算（与えたグラムから）
 */
export function intakeFromServing(per100g: Per100g, servingGrams: number): Intake {
  const ratio = servingGrams / 100;
  return {
    kcal:    per100g.kcalPer100g * ratio,
    protein: (per100g.protein_g ?? 0) * ratio,
    fat:     (per100g.fat_g ?? 0) * ratio,
    carbs:   (per100g.carbs_g ?? 0) * ratio,
  };
}

/**
 * 複数アイテムの摂取を合算
 */
export function sumIntakes(items: Intake[]): Intake {
  return items.reduce<Intake>((acc, v) => ({
    kcal: acc.kcal + (v.kcal || 0),
    protein: acc.protein + (v.protein || 0),
    fat: acc.fat + (v.fat || 0),
    carbs: acc.carbs + (v.carbs || 0),
  }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
}

/**
 * 摂取栄養（合計）とターゲットの差分
 */
export function compareNutrition(
  intake: Intake,
  targets: Intake
) {
  return {
    kcal:    intake.kcal    - targets.kcal,
    protein: intake.protein - targets.protein,
    fat:     intake.fat     - targets.fat,
    carbs:   intake.carbs   - targets.carbs,
  };
}

/**
 * 不足/過多の判定
 * threshold：%（例えば20 → ±20%超えで不足/過剰）
 */
export function judgeBalance(
  diff: ReturnType<typeof compareNutrition>,
  targets: Intake,
  threshold = 20
): Record<keyof Intake, "不足" | "過剰" | "適正"> {
  const result: Record<keyof Intake, "不足" | "過剰" | "適正"> = {
    kcal: "適正",
    protein: "適正",
    fat: "適正",
    carbs: "適正",
  };

  (Object.keys(diff) as (keyof Intake)[]).forEach((key) => {
    const t = targets[key];
    if (!t || t <= 0) return;
    const pct = (diff[key] / t) * 100;
    if (pct > threshold) result[key] = "過剰";
    else if (pct < -threshold) result[key] = "不足";
  });

  return result;
}

/**
 * LLMに渡すレシピ生成プロンプト（例）
 * - 不足側を主に補う提案を期待
 * - アレルギー（除外食材）を反映
 */
export function buildRecipePrompt({
  diff,
  judgment,
  allergies,
}: {
  diff: ReturnType<typeof compareNutrition>;
  judgment: Record<keyof Intake, "不足" | "過剰" | "適正">;
  allergies: string[];
}) {
  const focus = (Object.entries(judgment) as [keyof Intake, string][])
    .filter(([, v]) => v === "不足")
    .map(([k]) => k)
    .join(", ");

  return `
あなたは猫用レシピを提案するアシスタントです。
次の栄養バランスの不足を主に補う簡単な献立を3案提案してください。

不足/過剰 差分: ${JSON.stringify(diff, null, 2)}
判定: ${JSON.stringify(judgment, null, 2)}
重点的に補う栄養: ${focus || "特になし（バランス維持）"}
除外すべき食材（アレルギー）: ${allergies.join(", ") || "なし"}

制約:
- 猫が安全に食べられる食材のみ（加熱・無味・骨/皮なし）
- 1回の分量は数グラム〜10g程度に留める
- 子猫/シニアなど年齢や消化を考慮して提案
- 作り方は簡潔に
`;
}

/** 使い方の一例（サービス層 or サーバーアクション側で）
 * 
 * import { calcMER as calcMERFeeding } from "@/lib/feeding"; // feeding.tsのMER
 * 
 * // プロフィールから必要カロリーを出す（feeding.ts を優先）
 * const mer = calcMERFeeding({
 *   weightKg: 4,
 *   ageYears: 3,
 *   sex: "MALE",
 *   activity: "MEDIUM",
 *   neutered: true,
 * });
 * 
 * const targets = generateTargets(mer);
 * const breakfast = intakeFromServing({ kcalPer100g: 360, protein_g: 32, fat_g: 14, carbs_g: 40 }, 35);
 * const dinner    = intakeFromServing({ kcalPer100g: 360, protein_g: 32, fat_g: 14, carbs_g: 40 }, 30);
 * const intake = sumIntakes([breakfast, dinner]);
 * const diff = compareNutrition(intake, targets);
 * const judgment = judgeBalance(diff, targets, 20);
 * const prompt = buildRecipePrompt({ diff, judgment, allergies: ["とうもろこし"] });
 */

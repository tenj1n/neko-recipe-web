// src/lib/catSchema.ts
import { z } from "zod";

export const activityEnum   = z.enum(["LOW", "NORMAL", "HIGH"]);
export const sexEnum        = z.enum(["オス", "メス", "不明"]);
export const hairAmountEnum = z.enum(["少ない", "普通", "多い"]);
export const sizeEnum       = z.enum(["小型", "中型", "大型"]);

export const catCreateSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(30, "30文字以内で入力してください"),

  // フォームの string を number に強制変換してからチェック
  weightKg: z.coerce.number().min(0.5, "0.5 kg 以上").max(15, "15 kg 以下"),
  ageYears: z.coerce
    .number()
    .int("年齢は整数で入力してください")
    .min(0, "0歳以上")
    .max(30, "30歳以下"),

  activity:   activityEnum,
  sex:        sexEnum,
  hairAmount: hairAmountEnum,
  size:       sizeEnum,

  // 統一: 繁殖防止フラグ（true/false）
  neutered: z.coerce.boolean(),

  allergies: z.string().max(200, "200文字以内で入力してください").optional().default(""),
});

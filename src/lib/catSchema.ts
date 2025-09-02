import { z } from "zod";

export const activityEnum = z.enum(["LOW", "NORMAL", "HIGH"]);
export const sexEnum = z.enum(["オス", "メス", "不明"]);
export const hairAmountEnum = z.enum(["少ない", "普通", "多い"]);
export const sizeEnum = z.enum(["小型", "中型", "大型"]);

export const catCreateSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(30, "30文字以内で入力してください"),

  // ✨ ここ：オプションを渡さない
  weightKg: z.coerce.number()
    .min(0.5, "0.5 kg 以上")
    .max(15, "15 kg 以下"),

  // ✨ ここも：オプションを渡さない
  ageYears: z.coerce.number()
    .int("年齢は整数で入力してください")
    .min(0, "0 歳以上")
    .max(30, "30 歳以下"),

  activity: activityEnum,
  sex: sexEnum,
  hairAmount: hairAmountEnum,
  size: sizeEnum,
  neutered: z.coerce.boolean(),

  // 空文字は undefined にする
  allergies: z.string().max(200, "200文字以内で入力してください")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type CatCreateInput = z.infer<typeof catCreateSchema>;

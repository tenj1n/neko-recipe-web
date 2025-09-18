// src/lib/intake.ts
import prisma from "@/lib/db";
import type { MealSlot, ProductVariant, Prisma } from "@prisma/client";

export type Totals = { kcal: number; protein: number; fat: number; carbs: number };

const slotOrder: Record<MealSlot, number> = {
  BREAKFAST: 1,
  LUNCH: 2,
  DINNER: 3,
  SNACK: 4,
};

const nz = (n: number | null | undefined) =>
  Number.isFinite(n as number) ? (n as number) : 0;

/** ProductVariant → 100gあたりの栄養（g と kcal） */
function per100gFromVariant(pv: ProductVariant): Totals {
  const protein = nz(pv.proteinMin);
  const fat = nz(pv.fatMin);
  const fiber = nz(pv.fiberMax);
  const ash = nz(pv.ashMax);
  const moisture = nz(pv.moistureMax);

  // 差分で炭水化物（NFE）推定
  const carbs = Math.max(0, 100 - (protein + fat + fiber + ash + moisture));

  // kcal/100g があれば優先、無ければ近似
  const kcal = pv.kcalPer100g ?? Math.round(protein * 3.5 + fat * 8.5 + carbs * 3.5);

  return { kcal, protein, fat, carbs };
}

/** 100g値 → grams 値へスケール */
function scale(per100g: Totals, grams: number): Totals {
  const r = grams / 100;
  return {
    kcal: Math.round(per100g.kcal * r),
    protein: +(per100g.protein * r).toFixed(1),
    fat: +(per100g.fat * r).toFixed(1),
    carbs: +(per100g.carbs * r).toFixed(1),
  };
}

/** 指定日（00:00–24:00）の摂取合計。untilSlot までで止めることも可。 */
export async function sumIntakeForCatDay(
  catId: string,             // ← String に修正
  dayISO: string,
  untilSlot?: MealSlot
): Promise<Totals> {
  const day = new Date(dayISO); day.setHours(0, 0, 0, 0);
  const next = new Date(day);   next.setDate(next.getDate() + 1);

  // include 付きの戻り値型を明示して items を型に載せる
  type MealWithItems = Prisma.MealGetPayload<{
    include: { items: { include: { productVariant: true } } }
  }>;

  const meals: MealWithItems[] = await prisma.meal.findMany({
    where: { catId, date: { gte: day, lt: next } },
    include: { items: { include: { productVariant: true } } },
    orderBy: { date: "asc" },
  });

  const limit = untilSlot ? slotOrder[untilSlot] : undefined;
  const totals: Totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

  for (const meal of meals) {
    if (limit && slotOrder[meal.slot] > limit) continue;

    for (const it of meal.items) {
      const grams = it.grams ?? 0;
      if (!grams || !it.productVariant) continue;

      const per = per100gFromVariant(it.productVariant);
      const add = scale(per, grams);

      totals.kcal += add.kcal;
      totals.protein += add.protein;
      totals.fat += add.fat;
      totals.carbs += add.carbs;
    }
  }

  totals.kcal = Math.round(totals.kcal);
  totals.protein = +totals.protein.toFixed(1);
  totals.fat = +totals.fat.toFixed(1);
  totals.carbs = +totals.carbs.toFixed(1);

  return totals;
}

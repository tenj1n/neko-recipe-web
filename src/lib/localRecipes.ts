// src/lib/localRecipes.ts
export type Recipe = {
  title: string;
  ingredients: string[];
  instructions: string;
};

function excludeAllergy(recipes: Recipe[], allergies: string[]) {
  if (!allergies?.length) return recipes;
  const ng = allergies.map(a => a.toLowerCase());
  return recipes.filter(r => {
    const hay = (r.ingredients.join(",") + r.title).toLowerCase();
    return !ng.some(a => hay.includes(a));
  });
}

/** ゼロコストのルールベース提案（最低3件返す） */
export function localRecipesFromDiff({
  diff,
  judgment,
  allergies = [],
}: {
  diff: { kcal: number; protein: number; fat: number; carbs: number };
  judgment: Record<"kcal" | "protein" | "fat" | "carbs", "不足" | "過剰" | "適正">;
  allergies?: string[];
}): Recipe[] {
  const POOL: Recipe[] = [
    {
      title: "白身魚(タラ)のスチーム",
      ingredients: ["タラ 8g", "ブロッコリー 3g(よく茹でて)"],
      instructions: "蒸してほぐし、ブロッコリーはペースト状にして少量混ぜる。"
    },
    {
      title: "ささみミンチのポタージュ",
      ingredients: ["鶏ささみ 8g", "水(茹で汁) 少量"],
      instructions: "茹でてミンチ、茹で汁でポタージュ状に。冷まして与える。"
    },
    {
      title: "鶏むねとカボチャのやわらか煮",
      ingredients: ["鶏むね(皮なし) 10g", "カボチャ 8g", "水 少量"],
      instructions: "材料を細かく刻み、よく煮て冷まして与える。味付け不要。"
    },
    {
      title: "鮭の蒸しほぐし（脂を少量補う）",
      ingredients: ["鮭(加熱) 6g", "白菜(よく茹でて) 3g"],
      instructions: "鮭はしっかり加熱して骨を除く。白菜は柔らかく茹でて少量混ぜる。"
    },
  ];

  const lacking = (["protein", "fat", "kcal", "carbs"] as const)
    .filter(k => judgment[k] === "不足");

  let pool = POOL.slice();
  if (lacking.includes("protein")) {
    pool.sort((a, b) =>
      (b.title.includes("ささみ") || b.title.includes("タラ") ? 1 : 0) -
      (a.title.includes("ささみ") || a.title.includes("タラ") ? 1 : 0)
    );
  } else if (lacking.includes("fat")) {
    pool.sort((a, b) => (b.title.includes("鮭") ? 1 : 0) - (a.title.includes("鮭") ? 1 : 0));
  }

  pool = excludeAllergy(pool, allergies);

  const out: Recipe[] = [];
  for (const r of pool) { if (out.length >= 3) break; out.push(r); }
  while (out.length < 3) out.push(POOL[out.length % POOL.length]);
  return out.slice(0, 3);
}

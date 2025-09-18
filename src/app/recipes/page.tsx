// src/app/recipes/page.tsx
"use client";

import { useState } from "react";
import type { Activity } from "@prisma/client";
import { parseRecipes, type Recipe } from "@/utils/parseRecipes";
import { calcMER as calcMERFeeding } from "@/lib/feeding";
import {
  generateTargets,
  intakeFromServing,
  sumIntakes,
  compareNutrition,
  judgeBalance,
  type Per100g,
} from "@/lib/nutrition";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);

    // ① 猫プロフィール（まずは固定値。後でDBに差し替え）
    const cat = {
      weightKg: 4,
      ageYears: 3,
      sex: "MALE",
      activity: "MEDIUM" as Activity, // ★ 型を合わせる
      neutered: true,
    };

    // ② 必要カロリー(MER) → ターゲット
    const mer = calcMERFeeding(cat);
    const targets = generateTargets(mer);

    // ③ その日の摂取（例：同一フードを朝35g/夜30g）
    const per100g: Per100g = { kcalPer100g: 360, protein_g: 32, fat_g: 14, carbs_g: 40 };
    const breakfast = intakeFromServing(per100g, 35);
    const dinner = intakeFromServing(per100g, 30);
    const intake = sumIntakes([breakfast, dinner]);

    // ④ 差分＆判定
    const diff = compareNutrition(intake, targets);
    const judgment = judgeBalance(diff, targets, 20);

    // ⑤ （仮）アレルギー
    const allergies: string[] = ["とうもろこし"];

    // ⑥ レシピ生成API（ローカル生成が配列で返る）
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff, judgment, allergies }),
      });
      const data = await res.json();

      const arr: Recipe[] = Array.isArray(data.recipes)
        ? data.recipes
        : parseRecipes(data.recipes); // 互換のため保険
      setRecipes(arr);
    } catch (e) {
      console.error(e);
      setRecipes([{ title: "エラー", ingredients: [], instructions: "生成に失敗しました。" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "生成中…" : "レシピ提案を生成"}
      </button>

      <div className="grid gap-4">
        {recipes.map((r, i) => (
          <div key={i} className="p-4 border rounded-lg shadow">
            <h2 className="font-bold text-lg">{r.title}</h2>
            {r.ingredients?.length > 0 && (
              <ul className="list-disc ml-6">
                {r.ingredients.map((ing, j) => <li key={j}>{ing}</li>)}
              </ul>
            )}
            <p className="mt-2">{r.instructions}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// src/lib/allergySync.ts
import { prisma } from "@/lib/db";

/** 日本語の原材料・アレルギー文字列を素直に分割 */
export function tokenizeJP(input: string): string[] {
  return (input ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()（）［］\[\]]/g, " ")
    .split(/[、,／\/・\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Cat.allergies のテキストを IngredientPreference(NG) に同期
 * - 追加：新しい語を NG で createMany
 * - 削除：allergies から消えた語の NG 行だけ deleteMany（OK/CAUTION は保持）
 */
export async function syncAllergiesToPrefs(catId: string, allergiesText: string) {
  const tokens = tokenizeJP(allergiesText);
  const unique = Array.from(new Set(tokens));

  await prisma.$transaction(async (tx) => {
    const existing = await tx.ingredientPreference.findMany({
      where: { catId, level: "NG" },
      select: { keyword: true },
    });
    const existingSet = new Set(
      existing.map((e) => e.keyword.normalize("NFKC").toLowerCase().trim())
    );

    // 追加
    const toAdd = unique.filter((k) => !existingSet.has(k));
    if (toAdd.length) {
      await tx.ingredientPreference.createMany({
        data: toAdd.map((keyword) => ({ catId, keyword, level: "NG" })),
        // ← SQLite は skipDuplicates 非対応。入れない！
      });
    }

    // 削除（NG のみ対象）
    const toRemove = [...existingSet].filter((k) => !unique.includes(k));
    if (toRemove.length) {
      await tx.ingredientPreference.deleteMany({
        where: { catId, level: "NG", keyword: { in: toRemove } },
      });
    }
  });
}

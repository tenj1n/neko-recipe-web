import { prisma } from "@/lib/db";

function norm(s: string) {
  return (s ?? "").trim().normalize("NFKC").toLowerCase();
}
function splitWords(s: string) {
  return (s || "")
    .replace(/[()（）［］\[\]]/g, " ")
    .split(/[、,／\/・\s]+/)
    .map(t => norm(t))
    .filter(Boolean);
}

/** Cat.allergies のテキストを NG として IngredientPreference に反映 */
export async function syncAllergiesToPrefs(catId: string, allergiesText: string) {
  const unique = Array.from(new Set(splitWords(allergiesText)));

  await prisma.$transaction(async (tx) => {
    const existing = await tx.ingredientPreference.findMany({
      where: { catId, level: "NG" },
      select: { keyword: true },
    });
    const existingSet = new Set(existing.map(e => norm(e.keyword)));

    // 追加（SQLiteなので createMany の skipDuplicates は使わず upsert）
    const toAdd = unique.filter(k => !existingSet.has(k));
    await Promise.all(
      toAdd.map((keyword) =>
        tx.ingredientPreference.upsert({
          where: { catId_keyword: { catId, keyword } },
          update: { level: "NG" },
          create: { catId, keyword, level: "NG" },
        })
      )
    );

    // 削除（free-text から消えた NG は消す）
    const toRemove = [...existingSet].filter(k => !unique.includes(k));
    if (toRemove.length) {
      await tx.ingredientPreference.deleteMany({
        where: { catId, level: "NG", keyword: { in: toRemove } },
      });
    }
  });
}

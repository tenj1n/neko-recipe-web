// src/app/products/[barcode]/page.tsx
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { barcode: string } };

// 文字正規化（%復元・NFKC・小文字・カタカナ→ひらがな）
const kanaToHira = (s: string) =>
  (s || "").replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
const norm = (s: string) => kanaToHira(decodeURIComponent((s ?? "").trim()))
  .normalize("NFKC")
  .toLowerCase();

// 「とうもろこし / トウモロコシ / ﾄｳﾓﾛｺｼ」等の区切り吸収
const tokenize = (t: string) =>
  (t || "")
    .replace(/[()（）［］\[\]]/g, " ")
    .split(/[、,／\/・\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);

export default async function ProductDetailPage({ params }: Props) {
  const key = norm(params.barcode);

  // barcode or name 完全一致
  const product = await prisma.product.findFirst({
    where: { OR: [{ barcode: key }, { name: key }] },
  });

  if (!product) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-lg font-semibold mb-2">未登録の商品です</h1>
        <p className="text-sm text-gray-400">
          キー: <code className="px-1 py-0.5 bg-gray-800/50 rounded">{key}</code>
        </p>
        <Link href="/search" className="underline block mt-3">
          検索へ戻る
        </Link>
      </div>
    );
  }

  // —— 選択中の猫IDを Cookie から取得（activeCatId / catId どちらでもOK）——
  const ck = await cookies();
  const activeCatId = ck.get("activeCatId")?.value ?? ck.get("catId")?.value ?? null;

  // —— 猫の嗜好マップ作成（IngredientPreference + Cat.allergies を統合）——
  const prefMap = new Map<string, "OK" | "CAUTION" | "NG">();

  if (activeCatId) {
    // 1) IngredientPreference を反映
    const prefs = await prisma.ingredientPreference.findMany({
      where: { catId: activeCatId },
      select: { keyword: true, level: true },
    });
    for (const p of prefs) {
      const k = norm(p.keyword);
      if (k) prefMap.set(k, p.level);
    }

    // 2) Cat.allergies を NG としてフォールバック追加
    const cat = await prisma.cat.findUnique({
      where: { id: activeCatId },
      select: { allergies: true, name: true },
    });
    for (const k of tokenize(cat?.allergies ?? "").map(norm)) {
      if (k && !prefMap.has(k)) prefMap.set(k, "NG");
    }
  }

  // —— 原材料の色付け —— 
  const tokens = tokenize(product.ingredients_text);
  const marked = tokens.map((w) => ({ word: w, level: prefMap.get(norm(w)) ?? null }));
  const ngList = marked.filter((m) => m.level === "NG").map((m) => m.word);
  const cautionList = marked.filter((m) => m.level === "CAUTION").map((m) => m.word);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="rounded-2xl bg-white text-black p-4">
        <div className="flex gap-4 items-start">
          {product.image ? (
            <img src={product.image} alt="" className="w-28 h-28 object-cover rounded" />
          ) : (
            <div className="w-28 h-28 bg-gray-200 grid place-items-center rounded">No Image</div>
          )}
          <div className="flex-1">
            <div className="text-xs text-gray-500">{product.brand || "ブランド未登録"}</div>
            <h1 className="text-lg font-semibold">{product.name}</h1>
            <div className="text-sm mt-1 text-gray-600">JAN/バーコード: {product.barcode}</div>
          </div>
        </div>

        {!activeCatId ? (
          <div className="mt-4 rounded-md border border-sky-500/40 bg-sky-400/10 text-sky-700 px-3 py-2 text-sm">
            猫が未選択のため、アレルギー判定は表示できません。右上のセレクターで猫を選んでください。
          </div>
        ) : (ngList.length > 0 || cautionList.length > 0) ? (
          <div className="mt-4 space-y-2">
            {ngList.length > 0 && (
              <div className="rounded-md border border-red-500/50 bg-red-600/10 text-red-600 px-3 py-2">
                <div className="font-semibold text-sm">アレルギー（NG）に該当</div>
                <div className="text-sm mt-1 break-words">{ngList.join("、")}</div>
              </div>
            )}
            {cautionList.length > 0 && (
              <div className="rounded-md border border-amber-500/50 bg-amber-400/10 text-amber-600 px-3 py-2">
                <div className="font-medium text-sm">注意が必要な成分</div>
                <div className="text-sm mt-1 break-words">{cautionList.join("、")}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-400/10 text-emerald-700 px-3 py-2 text-sm">
            アレルギー該当成分は見つかりませんでした。
          </div>
        )}

        <div className="mt-4">
          <div className="text-sm font-medium mb-1">原材料テキスト</div>
          {tokens.length === 0 ? (
            <div className="text-xs text-gray-500">(未入力)</div>
          ) : (
            <div className="text-sm leading-relaxed flex flex-wrap gap-x-1 gap-y-2">
              {marked.map((m, i) => {
                const base = "px-1 py-[1px] rounded";
                const cls =
                  m.level === "NG"
                    ? "bg-red-600 text-white"
                    : m.level === "CAUTION"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100";
                return (
                  <span key={`${m.word}-${i}`} className={`${base} ${cls}`}>
                    {m.word}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Link href="/search" className="text-sm underline underline-offset-2 opacity-80">
        ← 検索に戻る
      </Link>
    </div>
  );
}

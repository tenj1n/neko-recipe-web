"use client";
import { useEffect, useMemo, useState } from "react";
import { analyzeWithPrefs, PrefMap, PrefLevel } from "@/lib/analyzeIngredients";

type Product = {
  source?: string; // "local" なら自前DB
  barcode?: string;
  name?: string;
  brand?: string;
  image?: string;
  ingredients_text?: string;
};

export default function ProductCard({
  product,
  catId,
  onSaved,
}: {
  product: Product;
  catId: string | null;
  onSaved?: () => void;
}) {
  const [prefs, setPrefs] = useState<{ keyword: string; level: PrefLevel }[]>([]);
  const ingredients = product.ingredients_text ?? "";

  useEffect(() => {
    (async () => {
      if (!catId) return;
      const r = await fetch(`/api/cats/${catId}/prefs`, { cache: "no-store" });
      const j = await r.json();
      setPrefs(Array.isArray(j) ? j : []);
    })();
  }, [catId]);

  const prefMap: PrefMap = useMemo(() => {
    const m: PrefMap = {};
    for (const p of prefs) m[(p.keyword || "").toLowerCase()] = p.level;
    return m;
  }, [prefs]);

  const analysis = useMemo(
    () => analyzeWithPrefs(ingredients, prefMap),
    [ingredients, prefMap]
  );

  async function savePref(k: string, level: PrefLevel) {
    if (!catId) return;
    await fetch(`/api/cats/${catId}/prefs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: k.toLowerCase(), level }),
    });
    const r = await fetch(`/api/cats/${catId}/prefs`, { cache: "no-store" });
    setPrefs(await r.json());
    onSaved?.();
  }

  return (
    <div className="mt-4 border p-3 rounded">
      <div className="flex items-start gap-3">
        {product.image ? (
          <img src={product.image} alt="" className="w-24 h-24 object-cover rounded" />
        ) : (
          <div className="w-24 h-24 bg-gray-100 rounded" />
        )}
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {product.name || "名称不明"}
            {product.source === "local" && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-700 text-white">
                自前DB
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600">{product.brand}</div>
          {product.barcode && <div className="text-xs text-gray-500">JAN: {product.barcode}</div>}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-1">原材料</div>
        <div className="flex flex-wrap gap-1">
          {analysis.tokens.map((t: any, i: number) => {
            const k = (t.norm ?? t.word ?? "").toLowerCase();
            const base =
              t.level === "NG"
                ? "bg-red-700 text-white"
                : t.level === "CAUTION"
                ? "bg-orange-600 text-white"
                : "bg-emerald-700 text-white";
            return (
              <div key={i} className={`text-xs px-2 py-0.5 rounded ${base} flex items-center gap-1`}>
                <span>{t.word ?? t.norm}</span>
                {catId && (
                  <div className="flex gap-1">
                    <button
                      title="OKにする"
                      className="px-1 rounded bg-emerald-900"
                      onClick={() => savePref(k, "OK")}
                    >
                      OK
                    </button>
                    <button
                      title="注意"
                      className="px-1 rounded bg-orange-800"
                      onClick={() => savePref(k, "CAUTION")}
                    >
                      注意
                    </button>
                    <button
                      title="NG"
                      className="px-1 rounded bg-red-900"
                      onClick={() => savePref(k, "NG")}
                    >
                      NG
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-sm">
        <div>
          <span className="font-semibold mr-1">集計:</span>
          OK: {analysis.summary.OK.length} / 注意: {analysis.summary.CAUTION.length} / NG:{" "}
          {analysis.summary.NG.length}
        </div>
        {analysis.summary.CAUTION.length > 0 && (
          <div className="mt-1">
            <span className="text-orange-600 font-medium mr-1">注意:</span>
            {analysis.summary.CAUTION.join("、")}
          </div>
        )}
        {analysis.flags.hasNG && (
          <div className="mt-1 text-red-600 font-semibold">
            危険（NG）: {analysis.summary.NG.join("、")}
          </div>
        )}
      </div>
    </div>
  );
}

// src/components/ProductSearch.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Variant = {
  id: number; form: string; label: string; flavor: string;
  features: string | null; ingredients_text: string;
};
type Product = {
  id: number; barcode: string; name: string; brand: string;
  ingredients_text: string; variants: Variant[];
};

export default function ProductSearch() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 安全に JSON を読み取るヘルパ
  const safeJson = async (res: Response) => {
    const text = await res.text();               // ← 空でもOK
    if (!text) return [];                        // ← 本文なしは空配列に
    try { return JSON.parse(text); } catch { return []; }
  };

  const debouncedSearch = useMemo(() => {
    let t: any;
    return (value: string) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        // 既存リクエストは中止
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setError(null);
        if (!value.trim()) { setItems([]); return; }
        setLoading(true);
        try {
          const res = await fetch("/api/search", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ q: value }),
            signal: ac.signal,
          });

          if (!res.ok) {
            const data = await safeJson(res);
            setItems(Array.isArray(data) ? data : []);
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await safeJson(res);
          setItems(Array.isArray(data) ? data : []);
        } catch (e: any) {
          if (e?.name === "AbortError") return;  // 入力途中でキャンセルされた
          console.error(e);
          setError(e?.message ?? "fetch error");
          setItems([]);
        } finally {
          setLoading(false);
        }
      }, 250);
    };
  }, []);

  useEffect(() => { debouncedSearch(q); }, [q, debouncedSearch]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="シリーズ/年齢帯/形状/フレーバー（例：銀のスプーン 子猫 ドライ）"
        className="w-full px-3 py-2 rounded border bg-black text-white"
      />
      {loading && <div className="opacity-70 text-sm">検索中…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="border rounded p-3">
            <div className="font-semibold">{p.name}</div>
            <div className="text-xs opacity-70">{p.brand} / {p.barcode}</div>

            {p.variants?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <span key={v.id} className="text-xs px-2 py-1 rounded bg-neutral-800">
                    {v.form}・{v.label}{v.flavor ? `・${v.flavor}` : ""}{v.features ? `・${v.features}` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs opacity-60 mt-2">バリアント未登録</div>
            )}
          </div>
        ))}

        {!loading && q && items.length === 0 && !error && (
          <div className="opacity-70 text-sm">該当なし</div>
        )}
      </div>
    </div>
  );
}

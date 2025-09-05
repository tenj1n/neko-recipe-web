"use client";

import React, { useMemo, useState } from "react";
import { useActiveCat } from "@/lib/useActiveCat";
import TagDialog from "@/components/TagDialog";
import ProductCard from "@/components/ProductCard";

type Item = {
  source?: "local" | string;
  barcode?: string;
  name?: string;
  brand?: string;
  image?: string;
  ingredients_text?: string;
};

export default function ProductSearch() {
  const { catId } = useActiveCat();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [picked, setPicked] = useState<Item | null>(null);
  const [tagTarget, setTagTarget] = useState<Item | null>(null);

  const doSearch = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (value: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!value) {
          setResults([]);
          setPicked(null);
          setError(null);
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const r = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const j = await r.json();
          setResults(Array.isArray(j.items) ? j.items : []);
        } catch (e: any) {
          setError("検索に失敗しました。時間をおいて再度お試しください。");
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 350);
    };
  }, []);

  // 1枚だけ表示（詳細カード）
  if (picked) {
    return (
      <div className="space-y-2">
        <button className="text-sm underline" onClick={() => setPicked(null)}>
          ← 検索結果一覧へ戻る
        </button>
        <ProductCard product={picked} catId={catId ?? null} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            doSearch(v);
          }}
          placeholder="商品名を入力（例：シーバ、銀のスプーン 等）"
          className="border rounded px-3 py-2 w-full"
        />
        {/* ← 重複の原因だったリンクは削除 */}
      </div>

      {loading && <p>検索中…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <ul className="divide-y">
        {results.map((it, i) => (
          <li
            key={`${it.barcode ?? it.name ?? "row"}-${i}`}
            className="py-3 flex items-center gap-3"
          >
            {it.image ? (
              <img
                src={it.image}
                alt=""
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded" />
            )}

            <div className="flex-1 min-w-0">
              <div className="font-medium flex items-center gap-2 truncate">
                <span className="truncate">{it.name || "名称不明"}</span>
                {it.source === "local" && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-700 text-white">
                    自前DB
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 truncate">{it.brand}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPicked(it)}
                className="border px-3 py-1 rounded"
              >
                選択
              </button>

              <button
                onClick={() => setTagTarget(it)}
                className="border px-3 py-1 rounded"
                disabled={!catId}
                title={!catId ? "先に右上から猫を選択してください" : ""}
              >
                タグ設定
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* タグ編集モーダル */}
      {tagTarget && catId && (
        <TagDialog
          open={!!tagTarget}
          onClose={() => setTagTarget(null)}
          item={tagTarget}
          catId={catId}
          onSaved={() => {
            setTagTarget(null);
          }}
        />
      )}
    </div>
  );
}
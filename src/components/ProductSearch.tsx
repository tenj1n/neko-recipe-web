// src/components/ProductSearch.tsx
"use client";

import React, { useRef, useState } from "react";

type Variant = {
  id: number;
  form: string;
  label: string;
  flavor: string;
  features: string | null;
  ingredients_text: string;
};

type Product = {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  ingredients_text: string;
  variants: Variant[];
};

const SUGGESTS = ["まぐろ", "かつお", "子猫", "シニア", "ドライ", "パウチ", "室内", "毛玉"];

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="text-center space-y-3 p-6 border rounded-lg bg-neutral-900/40">
      <p className="text-sm text-gray-400">見つかりませんでした。条件を変えて再検索してください。</p>
      <p className="text-xs text-gray-500">例：「銀のスプーン 子猫 ドライ」「カルカン まぐろ」など</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {SUGGESTS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="px-3 py-1 rounded-full border text-sm hover:bg-neutral-800"
          >
            {s}
          </button>
        ))}
      </div>
      <a href="/scan" className="inline-block text-sm underline underline-offset-2 text-blue-300 hover:text-blue-200">
        バーコードで探す
      </a>
    </div>
  );
}

export default function ProductSearch() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return [];
    try { return JSON.parse(text); } catch { return []; }
  };

  const doSearch = async (value: string) => {
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

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = (data as any)?.message ?? "search failed";
        setItems([]);
        throw new Error(`HTTP ${res.status}: ${msg}`);
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error(e);
      setError(e?.message ?? "fetch error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => doSearch(q);

  const applyVariantChip = (p: Product, v: Variant) => {
    const next = [p.name, v.label, v.flavor].filter(Boolean).join(" ");
    setQ(next);
    doSearch(next);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              doSearch(q);
            }
          }}
          placeholder="シリーズ/年齢帯/形状/フレーバー（例：銀のスプーン 子猫 ドライ）"
          className="w-full px-3 py-2 rounded border bg-black text-white"
        />
        <button
          onClick={() => doSearch(q)}
          className="px-3 py-2 rounded border hover:bg-neutral-800"
          title="検索"
        >
          検索
        </button>
      </div>

      {loading && <div className="opacity-70 text-sm">検索中…</div>}

      {error && (
        <div className="text-sm border border-red-500/40 bg-red-500/10 text-red-300 p-3 rounded">
          <div className="mb-2">エラーが発生しました：{error}</div>
          <div className="flex items-center gap-3">
            <button onClick={retry} className="text-xs px-3 py-1 rounded border border-red-500/40 hover:bg-red-500/10">
              再試行
            </button>
            <a href="/scan" className="text-xs underline underline-offset-2">バーコードで探す</a>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="border rounded-2xl p-3">
            <div className="font-semibold">{p.name}</div>
            <div className="text-xs opacity-70">{p.brand} / {p.barcode}</div>

            {p.variants?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => applyVariantChip(p, v)}
                    className="text-xs px-2 py-1 rounded-full border bg-neutral-800 hover:bg-neutral-700"
                    title="この条件で絞り込む"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="mx-1">・</span>
                    <span className="text-indigo-300">{v.label}</span>
                    {v.flavor ? (
                      <>
                        <span className="mx-1">・</span>
                        <span className="text-pink-300">{v.flavor}</span>
                      </>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs opacity-60 mt-2">バリアント未登録</div>
            )}
          </div>
        ))}

        {!loading && q && items.length === 0 && !error && (
          <EmptyState onPick={(picked) => { setQ(picked); doSearch(picked); }} />
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type VariantOption = {
  id: number;
  productId: number;
  productName: string;
  brand: string;
  barcode?: string;
  label?: string;
  flavor?: string;
  form?: string;
  kcalPer100g?: number | null;
  proteinMin?: number | null;
  fatMin?: number | null;
  fiberMax?: number | null;
  ashMax?: number | null;
  moistureMax?: number | null;
};

type Props = {
  value: VariantOption | null;
  onSelect: (v: VariantOption) => void;
  placeholder?: string;
};

export default function VariantSearch({ value, onSelect, placeholder }: Props) {
  const [q, setQ] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<VariantOption[]>([]);
  const timer = useRef<number | null>(null);

  // 表示用テキスト
  const display = useMemo(() => {
    if (!value) return q;
    const parts = [value.productName, value.label, value.flavor, value.form].filter(Boolean);
    return parts.join(" / ");
  }, [value, q]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    // 入力が空なら閉じる＆結果クリア
    if (!q || q.trim().length === 0) {
      setItems([]);
      setOpen(false);
      return;
    }
    timer.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const url = `/api/debug/variants?q=${encodeURIComponent(q)}&limit=10`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        setItems((data?.items ?? []) as VariantOption[]);
        setOpen(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300); // 簡易デバウンス
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function choose(v: VariantOption) {
    onSelect(v);
    setOpen(false);
    setQ(""); // value（display）は value から描画する
  }

  function clear() {
    onSelect(null as any);
    setQ("");
    setItems([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          className="w-full rounded-md border bg-transparent p-2"
          placeholder={placeholder ?? "製品名・ラベル・フレーバーで検索"}
          value={display}
          onChange={(e) => {
            // value選択済みの状態でタイピングされたら value をクリアして検索に切替
            if (value) {
              onSelect(null as any);
            }
            setQ(e.target.value);
          }}
          onFocus={() => {
            if (!value && items.length > 0) setOpen(true);
          }}
        />
        <button
          type="button"
          className="rounded-md border px-3"
          onClick={clear}
          title="クリア"
        >
          ×
        </button>
      </div>

      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-black/40 backdrop-blur">
          {items.map((it) => (
            <li
              key={it.id}
              className="cursor-pointer px-3 py-2 hover:bg-white/10"
              onClick={() => choose(it)}
              title={`id:${it.id}`}
            >
              <div className="font-medium">
                {it.productName}
                {it.label ? ` / ${it.label}` : ""}
                {it.flavor ? ` / ${it.flavor}` : ""}
                {it.form ? ` / ${it.form}` : ""}
              </div>
              <div className="text-xs opacity-70">
                {it.brand ? `ブランド: ${it.brand} ` : ""}
                {Number.isFinite(it.kcalPer100g as number) ? `| ${it.kcalPer100g} kcal/100g` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <div className="absolute right-2 top-2 text-xs opacity-70">検索中...</div>
      )}
    </div>
  );
}

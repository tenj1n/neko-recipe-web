// src/app/meals/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Variant = {
  id: number;
  label: string;
  flavor: string | null;
  kcalPer100g: number | null;
  product: { name: string; brand: string; barcode: string };
};

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export default function MealsPage() {
  const [catId, setCatId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [slot, setSlot] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("BREAKFAST");
  const [q, setQ] = useState("");
  const [cands, setCands] = useState<Variant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [grams, setGrams] = useState<number>(30);
  const [notes, setNotes] = useState<string>("");

  // Cookie から activeCatId があれば初期値に
  useEffect(() => {
    if (typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|;\s*)activeCatId=([^;]+)/);
      if (m && !catId) setCatId(decodeURIComponent(m[1]));
    }
  }, []);

  // 検索
  useEffect(() => {
    const run = async () => {
      if (!q.trim()) { setCands([]); return; }
      const res = await fetch(`/api/variants?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCands(data.variants ?? []);
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [q]);

  const selected = useMemo(() => cands.find(v => v.id === selectedId) ?? null, [cands, selectedId]);

  async function addMeal() {
    if (!catId) { alert("catId が未指定です"); return; }
    if (!selected) { alert("商品（バリアント）を選んでください"); return; }
    if (!grams || grams <= 0) { alert("グラムを正しく入力してください"); return; }

    const payload = {
      catId,
      date,
      slot,
      notes: notes || undefined,
      items: [{ productVariantId: selected.id, grams: Math.round(grams) }],
    };

    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert("登録に失敗: " + (data.error ?? res.statusText));
      return;
    }
    alert("登録しました！");
    setQ("");
    setCands([]);
    setSelectedId(null);
    // ついでに合計も見たい場合は /api/intake を叩くなど
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">食事ログを追加</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-75">catId</span>
          <input className="px-3 py-2 rounded bg-neutral-800"
                 value={catId} onChange={(e)=>setCatId(e.target.value)} placeholder="cat の ID" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-75">日付</span>
          <input type="date" className="px-3 py-2 rounded bg-neutral-800"
                 value={date} onChange={(e)=>setDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-75">区分</span>
          <select className="px-3 py-2 rounded bg-neutral-800"
                  value={slot} onChange={(e)=>setSlot(e.target.value as any)}>
            <option value="BREAKFAST">朝食</option>
            <option value="LUNCH">昼食</option>
            <option value="DINNER">夕食</option>
            <option value="SNACK">間食</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-75">メモ（任意）</span>
          <input className="px-3 py-2 rounded bg-neutral-800"
                 value={notes} onChange={(e)=>setNotes(e.target.value)} />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-75">商品検索（名前/ブランド/バーコード）</span>
              <input className="px-3 py-2 rounded bg-neutral-800 w-full"
                     value={q} onChange={(e)=>setQ(e.target.value)} placeholder="例: CIAO / 490113..." />
            </label>
            {!!cands.length && (
              <div className="mt-2 max-h-48 overflow-auto border border-neutral-700 rounded">
                {cands.map(v=>(
                  <button key={v.id}
                          onClick={()=>setSelectedId(v.id)}
                          className={`w-full text-left px-3 py-2 hover:bg-neutral-800 ${selectedId===v.id ? "bg-neutral-800" : ""}`}>
                    <div className="text-sm">{v.product.name} <span className="opacity-60">({v.product.brand})</span></div>
                    <div className="text-xs opacity-60">{v.label} / {v.flavor || "no flavor"} / {v.product.barcode}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="w-40 flex flex-col gap-1">
            <span className="text-sm opacity-75">グラム</span>
            <input type="number" className="px-3 py-2 rounded bg-neutral-800"
                   value={grams} onChange={(e)=>setGrams(+e.target.value)} />
          </label>
        </div>

        {selected && (
          <div className="text-xs opacity-70">
            選択中: {selected.product.name} / {selected.label}（{selected.product.barcode}）
          </div>
        )}

        <button onClick={addMeal}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500">
          追加する
        </button>
      </div>
    </div>
  );
}

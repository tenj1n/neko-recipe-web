"use client";

import { useMemo, useState } from "react";
import useActiveCat from "@/lib/useActiveCat";
import BarcodeScanner from "@/components/BarcodeScanner";

/** /api/debug/variants の最小返却形 */
type VariantOption = {
  id: number;
  productId: number;
  productName: string;
  brand?: string;
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

type MealSlot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

type ItemRow = {
  id: string;
  grams: number | "";
  query: string;               // キーワード or バーコード
  searching: boolean;
  results: VariantOption[];
  variant: VariantOption | null;
};

const SLOTS: { label: string; value: MealSlot }[] = [
  { label: "朝ごはん", value: "BREAKFAST" },
  { label: "昼ごはん", value: "LUNCH" },
  { label: "夜ごはん", value: "DINNER" },
  { label: "おやつ", value: "SNACK" },
];

function todayISO() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default function NewMealUnifiedPage() {
  // 右上の選択（だけ）を参照。画面には猫名を出さない。
  const { cat, isLoading } = useActiveCat();
  const catId = cat?.id ?? null;

  // フォーム
  const [date, setDate] = useState<string>(todayISO());
  const [slot, setSlot] = useState<MealSlot>("BREAKFAST");

  // 明細行
  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), grams: "", query: "", searching: false, results: [], variant: null },
  ]);

  // UI 状態
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanRowId, setScanRowId] = useState<string | null>(null); // スキャン対象の行

  // 行操作
  function patchRow(id: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), grams: "", query: "", searching: false, results: [], variant: null },
    ]);
  }
  function removeRow(id: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }
  function clearRow(id: string) {
    patchRow(id, { grams: "", query: "", results: [], variant: null });
  }

  // 検索（キーワード/バーコード自動判定）— /api/debug/variants を利用
  async function searchRow(id: string) {
    const row = items.find((r) => r.id === id);
    if (!row) return;
    const q = row.query.trim();
    if (!q) {
      patchRow(id, { results: [] });
      return;
    }

    const isBarcode = /^[0-9]{6,}$/.test(q);
    const params = new URLSearchParams();
    if (isBarcode) params.set("barcode", q);
    else params.set("q", q);
    params.set("limit", "20");

    try {
      patchRow(id, { searching: true });
      const res = await fetch(`/api/debug/variants?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const list: VariantOption[] = data?.items ?? [];

      // 1件だけなら自動確定
      if (list.length === 1) {
        patchRow(id, { variant: list[0], results: [], searching: false });
        setMessage("");
        return;
      }

      patchRow(id, { results: list, searching: false });
      setMessage(list.length ? "" : "該当する製品が見つかりませんでした");
    } catch (e) {
      console.error(e);
      patchRow(id, { searching: false });
      setMessage("検索中にエラーが発生しました");
    }
  }

  // スキャン完了時：値をその行の query に入れて検索実行
  function handleScanDetected(code: string) {
    const rowId = scanRowId;
    if (!rowId) return;
    patchRow(rowId, { query: code });
    setScanRowId(null);
    setTimeout(() => searchRow(rowId), 50);
  }

  // 送信ボタン可否
  const canSubmit = useMemo(() => {
    if (!catId || !date || !slot) return false;
    const valid = items.filter((r) => r.variant?.id && typeof r.grams === "number" && r.grams > 0);
    return valid.length > 0 && !submitting;
  }, [catId, date, slot, items, submitting]);

  // 保存
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      if (!catId) {
        setMessage("右上で猫を選択してください。");
        return;
      }
      setSubmitting(true);
      const payload = {
        catId,
        date,
        slot,
        items: items
          .filter((r) => r.variant?.id && typeof r.grams === "number" && r.grams > 0)
          .map((r) => ({ productVariantId: r.variant!.id, grams: r.grams as number })),
      };
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "保存に失敗しました");
      setMessage("保存しました ✅");
      setItems([{ id: crypto.randomUUID(), grams: "", query: "", searching: false, results: [], variant: null }]);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message ?? "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">給餌ログ（検索+バーコード）</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日付・区分のみ（猫名は表示しない） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">日付</span>
            <input
              type="date"
              className="rounded-md border bg-transparent p-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading || !catId}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">区分</span>
            <select
              className="rounded-md border bg-transparent p-2"
              value={slot}
              onChange={(e) => setSlot(e.target.value as MealSlot)}
              disabled={isLoading || !catId}
            >
              {SLOTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </label>
        </div>

        {/* 明細行 */}
        <div className="space-y-3">
          {items.map((row, idx) => (
            <div key={row.id} className="rounded-xl border p-3 space-y-3 relative">
              {/* 選択済み概要 */}
              {row.variant ? (
                <div className="rounded-md border px-3 py-2 text-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {row.variant.productName}{row.variant.brand ? `（${row.variant.brand}）` : ""}
                    </div>
                    <div className="opacity-80">
                      {row.variant.label || "無印"}
                      {row.variant.flavor ? ` / ${row.variant.flavor}` : ""}
                      {row.variant.form ? ` / ${row.variant.form}` : ""}
                      {Number.isFinite(row.variant.kcalPer100g as number) ? ` / ${row.variant.kcalPer100g} kcal/100g` : ""}
                    </div>
                  </div>
                  <button type="button" className="text-xs rounded-md border px-2 py-1" onClick={() => patchRow(row.id, { variant: null })}>
                    変更
                  </button>
                </div>
              ) : (
                <div className="text-sm opacity-70">未選択（{idx + 1}行目）</div>
              )}

              {/* 検索・スキャン・グラム */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <input
                    className="flex-1 rounded-md border bg-transparent p-2"
                    placeholder="製品名/ラベル/フレーバー または バーコード（数字）"
                    value={row.query}
                    onChange={(e) => patchRow(row.id, { query: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchRow(row.id); } }}
                    disabled={isLoading || !catId}
                  />
                  <button
                    type="button"
                    className="rounded-md border px-3 py-2"
                    onClick={() => searchRow(row.id)}
                    disabled={row.searching || !row.query.trim() || !catId || isLoading}
                    title="Enter でも検索できます"
                  >
                    {row.searching ? "検索中..." : "検索"}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-3 py-2"
                    onClick={() => setScanRowId(row.id)}
                    title="カメラでバーコードを読み取り"
                    disabled={!catId || isLoading}
                  >
                    📷 スキャン
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-28 rounded-md border bg-transparent p-2"
                    placeholder="g"
                    value={row.grams}
                    onChange={(e) => patchRow(row.id, { grams: e.target.value === "" ? "" : Number(e.target.value) })}
                    disabled={!row.variant || !catId || isLoading}
                  />
                  <span className="text-sm">g</span>
                </div>

                <div className="flex gap-2">
                  <button type="button" className="rounded-md border px-3 py-2" onClick={() => clearRow(row.id)} disabled={!catId || isLoading}>
                    クリア
                  </button>
                  <button type="button" className="rounded-md border px-3 py-2" onClick={() => removeRow(row.id)} disabled={items.length <= 1 || !catId || isLoading}>
                    削除
                  </button>
                </div>
              </div>

              {/* 検索結果 */}
              {row.results.length > 0 && (
                <div className="rounded-lg border p-2 space-y-1">
                  {row.results.map((v) => (
                    <div key={v.id} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1">
                      <div className="text-sm">
                        <div className="font-medium">{v.productName}</div>
                        <div className="opacity-70">
                          {v.brand ? `ブランド: ${v.brand}　` : ""}
                          {v.barcode ? `バーコード: ${v.barcode}　` : ""}
                          {v.label || "無印"}
                          {v.flavor ? ` / ${v.flavor}` : ""}
                          {v.form ? ` / ${v.form}` : ""}
                          {Number.isFinite(v.kcalPer100g as number) ? ` / ${v.kcalPer100g} kcal/100g` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs rounded-md border px-2 py-1"
                        onClick={() => patchRow(row.id, { variant: v, results: [] })}
                      >
                        このバリアントを選択
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* スキャナのオーバーレイ */}
              {scanRowId === row.id && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <div className="w-full max-w-lg rounded-xl border bg-black/40 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">バーコードスキャン</div>
                      <button className="rounded-md border px-3 py-1" onClick={() => setScanRowId(null)}>
                        閉じる
                      </button>
                    </div>
                    <BarcodeScanner onDetected={handleScanDetected} />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="button" className="rounded-md border px-4 py-2" onClick={addRow} disabled={!catId || isLoading}>
            行を追加
          </button>
        </div>

        {/* 保存 */}
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-md bg-blue-600 px-5 py-2 text-white disabled:opacity-50" disabled={!canSubmit}>
            {submitting ? "保存中..." : "保存"}
          </button>
          {message && <span className="text-sm opacity-80">{message}</span>}
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeIngredients } from "@/lib/analyzeIngredients"; // ← これだけあればOK
import { IngredientLevel } from "@prisma/client";

type Item = {
  name?: string;
  brand?: string;
  image?: string;
  ingredients_text?: string;
};

type PrefLevel = IngredientLevel;
type PrefMap = Record<string, PrefLevel>;

/** UI用に最低限の形に正規化して使う */
type AnalyzeUiResult = {
  tokens: { word?: string; norm?: string }[];
  summary: { OK: string[]; CAUTION: string[]; NG: string[] };
};

export default function TagDialog({
  open,
  onClose,
  item,
  catId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: Item;
  catId: string;
  onSaved?: () => void;
}) {
  const ingredients = item.ingredients_text ?? "";

  // 現在の嗜好（DB）
  const [serverPrefs, setServerPrefs] = useState<
    { keyword: string; level: PrefLevel }[]
  >([]);
  // ローカル編集用（保存を押すまで確定しない）
  const [localMap, setLocalMap] = useState<Record<string, PrefLevel | null>>(
    {}
  );
  const [saving, setSaving] = useState(false);

  // 現在の嗜好ロード
  useEffect(() => {
    if (!open) return;
    (async () => {
      const r = await fetch(`/api/cats/${catId}/prefs`, { cache: "no-store" });
      const j = await r.json();
      const arr: { keyword: string; level: PrefLevel }[] = Array.isArray(j)
        ? j
        : [];
      setServerPrefs(arr);

      const map: Record<string, PrefLevel | null> = {};
      for (const p of arr) map[(p.keyword || "").toLowerCase()] = p.level;
      setLocalMap(map);
    })();
  }, [open, catId]);

  // 解析（ローカル編集は保存時にサーバへ反映。UI では結果だけ使う）
  const prefMap: PrefMap = useMemo(() => {
    const m: PrefMap = {};
    for (const k of Object.keys(localMap)) {
      const v = localMap[k];
      if (v) m[k] = v;
    }
    return m;
  }, [localMap]);

  const analysis: AnalyzeUiResult = useMemo(() => {
    try {
      // ★ 実装側が受け付けるのは catId だけなので override は渡さない
      const res: any = analyzeIngredients(ingredients, { catId });

      // UIで必要な最小セットに正規化（欠けていても落ちないように）
      const tokens = Array.isArray(res?.tokens) ? res.tokens : [];
      const summary = {
        OK: Array.isArray(res?.summary?.OK) ? res.summary.OK : [],
        CAUTION: Array.isArray(res?.summary?.CAUTION)
          ? res.summary.CAUTION
          : [],
        NG: Array.isArray(res?.summary?.NG) ? res.summary.NG : [],
      };
      return { tokens, summary };
    } catch {
      return { tokens: [], summary: { OK: [], CAUTION: [], NG: [] } };
    }
  }, [ingredients, catId]);

  function setLevel(normKey: string, level: PrefLevel | null) {
    setLocalMap((prev) => ({ ...prev, [normKey]: level }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = Object.entries(localMap)
        .filter(([, level]) => !!level)
        .map(([keyword, level]) => ({ keyword, level }));

      await fetch(`/api/cats/${catId}/prefs/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* 背景 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* パネル */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(720px,92vw)] max-h-[85vh] overflow-auto rounded-2xl bg-zinc-900 border border-zinc-700 p-4">
        <div className="flex items-start gap-3">
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-800 rounded" />
          )}
          <div className="flex-1">
            <div className="font-semibold">{item.name || "名称不明"}</div>
            <div className="text-xs text-gray-400">{item.brand}</div>
          </div>

          <button className="text-sm underline" onClick={onClose}>
            閉じる
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-400">
          成分ラベルをクリック → 右側の「OK / 注意 / NG」で選択。保存ボタンで反映されます。
        </div>

        {/* 成分チップ */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(analysis.tokens ?? []).map((t, i) => {
            const norm = (t.norm ?? t.word ?? "").toLowerCase();
            const chosen = localMap[norm] ?? null;

            const chipColor =
              chosen === "NG"
                ? "bg-red-700 text-white"
                : chosen === "CAUTION"
                ? "bg-orange-600 text-white"
                : chosen === "OK"
                ? "bg-emerald-700 text-white"
                : "bg-zinc-800 text-zinc-200 opacity-70"; // 未選択は淡色

            return (
              <div
                key={`${norm}-${i}`}
                className={`text-xs px-2 py-1 rounded ${chipColor} flex items-center gap-2`}
              >
                <span>{t.word ?? t.norm}</span>

                {/* 三択ボタン */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded border text-[10px] ${
                      chosen === "OK"
                        ? "bg-emerald-600 border-emerald-400 text-white"
                        : "bg-zinc-900/40 border-zinc-600 text-zinc-200"
                    }`}
                    onClick={() => setLevel(norm, "OK")}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded border text-[10px] ${
                      chosen === "CAUTION"
                        ? "bg-orange-600 border-orange-400 text-white"
                        : "bg-zinc-900/40 border-zinc-600 text-zinc-200"
                    }`}
                    onClick={() => setLevel(norm, "CAUTION")}
                  >
                    注意
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded border text-[10px] ${
                      chosen === "NG"
                        ? "bg-red-600 border-red-400 text-white"
                        : "bg-zinc-900/40 border-zinc-600 text-zinc-200"
                    }`}
                    onClick={() => setLevel(norm, "NG")}
                  >
                    NG
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded border text-[10px] ${
                      chosen === null
                        ? "bg-zinc-700 border-zinc-500 text-white"
                        : "bg-zinc-900/40 border-zinc-600 text-zinc-200"
                    }`}
                    onClick={() => setLevel(norm, null)}
                    title="未選択に戻す"
                  >
                    解除
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 集計 */}
        <div className="mt-4 text-sm">
          <div>
            <span className="font-semibold mr-1">集計:</span>
            OK: {analysis.summary.OK.length} / 注意:{" "}
            {analysis.summary.CAUTION.length} / NG: {analysis.summary.NG.length}
          </div>
          {!!analysis.summary.CAUTION.length && (
            <div className="mt-1">
              <span className="text-orange-500 font-medium mr-1">注意:</span>
              {analysis.summary.CAUTION.join("、")}
            </div>
          )}
          {!!analysis.summary.NG.length && (
            <div className="mt-1 text-red-500 font-semibold">
              危険（NG）: {analysis.summary.NG.join("、")}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 rounded border" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="px-4 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

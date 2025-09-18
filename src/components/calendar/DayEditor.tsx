// src/components/calendar/DayEditor.tsx
"use client";

import { useEffect, useState } from "react";
import type { DaySummary } from "./types";
import { SLOTS, SLOT_LABEL_JA, type Slot } from "./types";

type StoolStatus = "NONE" | "NORMAL" | "SOFT" | "DIARRHEA" | "HARD";
const STOOL_STATUSES = [
  { value: "NONE", label: "なし(❌)" },
  { value: "NORMAL", label: "普通(💩)" },
  { value: "SOFT", label: "軟便(💩💧)" },
  { value: "DIARRHEA", label: "下痢(💩💦)" },
  { value: "HARD", label: "硬い(💩🧱)" },
] as const;

type ItemDraft = {
  name?: string;
  grams: number;
  kcal?: number;
  productVariantId?: number | null;
  productId?: number | null;
  ingredientsText?: string | null;
  source?: string | null;
};

const inputBaseCls =
  "block w-full mt-1 border rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border-zinc-300 " +
  "dark:bg-zinc-900/60 dark:text-gray-100 dark:placeholder-gray-500 dark:border-zinc-700";

type Nutrition = {
  totals: { kcal: number; protein_g?: number; fat_g?: number; fiber_g?: number };
  targets: { kcal: number; protein_g?: number; fat_g?: number };
  diff: { kcal: number; protein_g?: number; fat_g?: number };
  explanation?: string;
};

export default function DayEditor({
  dateYmd,
  initialDay,
  onClose,
}: {
  dateYmd: string;
  initialDay?: DaySummary;
  onClose: (changed: boolean) => void;
}) {
  const [changed, setChanged] = useState(false);
  const [activeTab, setActiveTab] = useState<"stool" | "meal" | "nutrition">("stool");
  const [nutrition, setNutrition] = useState<Nutrition | null>(null);
  const [loadingNut, setLoadingNut] = useState(false);

  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const showToast = (t: { kind: "success" | "error"; text: string }) => {
    setToast(t);
    setTimeout(() => setToast(null), 2500);
  };

  const [stool, setStool] = useState<{
    status: StoolStatus;
    color?: string;
    amount?: string;
    mucus?: boolean;
    blood?: boolean;
    note?: string;
  }>(() => {
    const s = initialDay?.stool;
    return {
      status: (s?.status as StoolStatus) ?? "NONE",
      color: s?.color ?? "",
      amount: s?.amount ?? "",
      mucus: !!s?.mucus,
      blood: !!s?.blood,
      note: s?.note ?? "",
    };
  });

  const [slotNotes, setSlotNotes] = useState<Record<Slot, string>>({
    BREAKFAST: initialDay?.slots.BREAKFAST?.notes ?? "",
    LUNCH: initialDay?.slots.LUNCH?.notes ?? "",
    DINNER: initialDay?.slots.DINNER?.notes ?? "",
    SNACK: initialDay?.slots.SNACK?.notes ?? "",
  });
  const [slotItems, setSlotItems] = useState<Record<Slot, ItemDraft[]>>({
    BREAKFAST: initialDay?.slots.BREAKFAST?.items?.map(toDraft) ?? [],
    LUNCH: initialDay?.slots.LUNCH?.items?.map(toDraft) ?? [],
    DINNER: initialDay?.slots.DINNER?.items?.map(toDraft) ?? [],
    SNACK: initialDay?.slots.SNACK?.items?.map(toDraft) ?? [],
  });

  function toDraft(it: any): ItemDraft {
    return {
      name: it.name ?? it.product?.name ?? "",
      grams: it.grams ?? 0,
      kcal: it.kcal ?? undefined,
      productVariantId: it.productVariantId ?? null,
      productId: it.productId ?? null,
      ingredientsText: it.ingredientsText ?? null,
      source: it.source ?? null,
    };
  }

  useEffect(() => {
    setChanged(false);
    fetchNutrition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateYmd]);

  async function fetchNutrition() {
    setLoadingNut(true);
    try {
      const res = await fetch(`/api/nutrition/summary?date=${dateYmd}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setNutrition({
          totals: data.totals,
          targets: data.targets,
          diff: data.diff,
          explanation: data.explanation,
        });
      } else {
        setNutrition(null);
      }
    } finally {
      setLoadingNut(false);
    }
  }

  async function saveStool() {
    const payload = {
      date: dateYmd,
      status: stool.status,
      color: stool.color || undefined,
      amount: stool.amount || undefined,
      mucus: Boolean(stool.mucus),
      blood: Boolean(stool.blood),
      note: stool.note || undefined,
    };
    const res = await fetch("/api/stool", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function saveSlot(slot: Slot) {
    const payload = {
      date: dateYmd,
      slot,
      notes: slotNotes[slot] || undefined,
      items: (slotItems[slot] ?? []).map((it) => ({
        name: it.name || undefined,
        grams: Number(it.grams) || 0,
        kcal: it.kcal ? Number(it.kcal) : undefined,
        productVariantId: it.productVariantId ?? undefined,
        productId: it.productId ?? undefined,
        ingredientsText: it.ingredientsText ?? undefined,
        source: it.source ?? undefined,
      })),
    };
    const res = await fetch("/api/meals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100
                   w-full sm:w-[980px] max-h-[90vh] rounded-t-2xl sm:rounded-2xl
                   shadow-lg overflow-auto"
      >
        <div className="p-4 border-b dark:border-zinc-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{dateYmd} の記録</h2>
          <button
            className="px-3 py-2 rounded bg-gray-100 dark:bg-zinc-800 border dark:border-zinc-700"
            onClick={() => onClose(changed)}
          >
            閉じる
          </button>
        </div>

        {/* トースト */}
        {toast && (
          <div
            className={`mx-4 mt-3 px-3 py-2 rounded text-sm ${
              toast.kind === "success"
                ? "bg-emerald-600/15 text-emerald-200 border border-emerald-700"
                : "bg-rose-600/15 text-rose-200 border border-rose-700"
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* タブ */}
        <div className="px-4 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("stool")}
              className={`px-3 py-1.5 rounded border text-sm ${
                activeTab === "stool"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-gray-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              }`}
            >
              うんちログ
            </button>
            <button
              onClick={() => setActiveTab("meal")}
              className={`px-3 py-1.5 rounded border text-sm ${
                activeTab === "meal"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              }`}
            >
              食事入力
            </button>
            <button
              onClick={() => fetchNutrition().then(() => setActiveTab("nutrition"))}
              className={`px-3 py-1.5 rounded border text-sm ${
                activeTab === "nutrition"
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-gray-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              }`}
            >
              栄養サマリ
            </button>
          </div>
        </div>

        {/* タブパネル */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* うんちログ */}
          {activeTab === "stool" && (
            <section className="border rounded-xl p-4 bg-white dark:bg-zinc-800 dark:border-zinc-700">
              <h3 className="font-semibold mb-3">うんちログ</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  状態
                  <select
                    className={inputBaseCls}
                    value={stool.status}
                    onChange={(e) => {
                      setStool((s) => ({ ...s, status: e.target.value as StoolStatus }));
                      setChanged(true);
                    }}
                  >
                    {STOOL_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  色
                  <input
                    className={inputBaseCls}
                    placeholder="黄土色 など"
                    value={stool.color ?? ""}
                    onChange={(e) => {
                      setStool((s) => ({ ...s, color: e.target.value }));
                      setChanged(true);
                    }}
                  />
                </label>

                <label className="text-sm">
                  量
                  <input
                    className={inputBaseCls}
                    placeholder="少/普/多 など"
                    value={stool.amount ?? ""}
                    onChange={(e) => {
                      setStool((s) => ({ ...s, amount: e.target.value }));
                      setChanged(true);
                    }}
                  />
                </label>

                <div className="flex items-center gap-6 mt-6">
                  <label className="text-sm inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!stool.mucus}
                      onChange={(e) => {
                        setStool((s) => ({ ...s, mucus: e.target.checked }));
                        setChanged(true);
                      }}
                    />
                    粘液あり
                  </label>
                  <label className="text-sm inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!stool.blood}
                      onChange={(e) => {
                        setStool((s) => ({ ...s, blood: e.target.checked }));
                        setChanged(true);
                      }}
                    />
                    血あり
                  </label>
                </div>

                <label className="col-span-2 text-sm">
                  メモ
                  <textarea
                    className={inputBaseCls}
                    rows={3}
                    value={stool.note ?? ""}
                    onChange={(e) => {
                      setStool((s) => ({ ...s, note: e.target.value }));
                      setChanged(true);
                    }}
                  />
                </label>
              </div>

              <div className="mt-3">
                <button
                  className="px-4 py-2 rounded bg-emerald-600 text-white"
                  onClick={async () => {
                    try {
                      await saveStool();
                      setChanged(true);
                      showToast({ kind: "success", text: "うんちログを保存しました" });
                    } catch (e: any) {
                      showToast({ kind: "error", text: `保存に失敗: ${e?.message ?? ""}` });
                    }
                  }}
                >
                  うんちログを保存
                </button>
              </div>
            </section>
          )}

          {/* 食事入力 */}
          {activeTab === "meal" && (
            <section className="border rounded-xl p-4 bg-white dark:bg-zinc-800 dark:border-zinc-700">
              <h3 className="font-semibold mb-3">食事スロット</h3>
              <div className="space-y-6">
                {SLOTS.map((slot) => (
                  <div key={slot} className="border rounded-lg p-3 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{SLOT_LABEL_JA[slot]}</div>
                      <button
                        className="px-3 py-1.5 rounded bg-blue-600 text-white"
                        onClick={async () => {
                          try {
                            await saveSlot(slot);
                            setChanged(true);
                            await fetchNutrition();
                            setActiveTab("nutrition");
                            showToast({ kind: "success", text: `${SLOT_LABEL_JA[slot]}を保存しました` });
                          } catch (e: any) {
                            showToast({ kind: "error", text: `保存に失敗: ${e?.message ?? ""}` });
                          }
                        }}
                      >
                        {SLOT_LABEL_JA[slot]}を保存
                      </button>
                    </div>

                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      メモ
                    </label>
                    <input
                      className={inputBaseCls}
                      placeholder="食いつき良い / 吐き戻しなし など"
                      value={slotNotes[slot] ?? ""}
                      onChange={(e) => {
                        setSlotNotes((s) => ({ ...s, [slot]: e.target.value }));
                        setChanged(true);
                      }}
                    />

                    <div className="space-y-1 mt-2">
                      {(slotItems[slot] ?? []).map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            className={`${inputBaseCls} w-[50%]`}
                            placeholder="手入力名（例：ゆでささみ）"
                            value={it.name ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSlotItems((s) => {
                                const arr = [...(s[slot] ?? [])];
                                arr[idx] = { ...arr[idx], name: v };
                                return { ...s, [slot]: arr };
                              });
                              setChanged(true);
                            }}
                          />
                          <input
                            type="number"
                            className={`${inputBaseCls} w-[20%]`}
                            placeholder="g"
                            value={Number.isFinite(it.grams) ? it.grams : 0}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setSlotItems((s) => {
                                const arr = [...(s[slot] ?? [])];
                                arr[idx] = { ...arr[idx], grams: v };
                                return { ...s, [slot]: arr };
                              });
                              setChanged(true);
                            }}
                          />
                          <input
                            type="number"
                            className={`${inputBaseCls} w-[20%]`}
                            placeholder="kcal(任意)"
                            value={it.kcal ?? ""}
                            onChange={(e) => {
                              const v = e.target.value === "" ? undefined : Number(e.target.value);
                              setSlotItems((s) => {
                                const arr = [...(s[slot] ?? [])];
                                arr[idx] = { ...arr[idx], kcal: v as any };
                                return { ...s, [slot]: arr };
                              });
                              setChanged(true);
                            }}
                          />
                          <button
                            className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-700 border dark:border-zinc-600"
                            onClick={() => {
                              setSlotItems((s) => {
                                const arr = [...(s[slot] ?? [])];
                                arr.splice(idx, 1);
                                return { ...s, [slot]: arr };
                              });
                              setChanged(true);
                            }}
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="px-3 py-1.5 rounded bg-gray-100 dark:bg-zinc-700 border dark:border-zinc-600"
                        onClick={() => {
                          setSlotItems((s) => ({
                            ...s,
                            [slot]: [...(s[slot] ?? []), { name: "", grams: 0, kcal: undefined }],
                          }));
                          setChanged(true);
                        }}
                      >
                        + アイテム追加（手入力）
                      </button>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ※ 商品選択やバーコードは後で差し込み可
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 栄養サマリ */}
          {activeTab === "nutrition" && (
            <section className="border rounded-xl p-4 bg-white dark:bg-zinc-800 dark:border-zinc-700 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">栄養サマリ（{dateYmd}）</h3>
                <button
                  className="px-3 py-1.5 rounded bg-gray-100 dark:bg-zinc-700 border dark:border-zinc-600 text-sm"
                  onClick={() => fetchNutrition()}
                >
                  再計算
                </button>
              </div>

              {loadingNut ? (
                <div className="text-sm text-gray-500">計算中…</div>
              ) : nutrition ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CardStat label="摂取kcal" value={`${nutrition.totals.kcal} kcal`} />
                    <CardStat label="目標kcal" value={`${nutrition.targets.kcal} kcal`} />
                    <CardStat
                      label="差分"
                      value={`${sign(nutrition.diff.kcal)} kcal`}
                      tone={nutrition.diff.kcal < -30 ? "bad" : nutrition.diff.kcal > 50 ? "warn" : "ok"}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <CardStat label="たんぱく" value={gOrQ(nutrition.totals.protein_g)} />
                    <CardStat label="脂質" value={gOrQ(nutrition.totals.fat_g)} />
                    <CardStat label="食物繊維" value={gOrQ(nutrition.totals.fiber_g)} />
                  </div>

                  {nutrition.explanation ? (
                    <div className="mt-4 p-3 rounded bg-violet-50 text-violet-900 dark:bg-violet-900/20 dark:text-violet-200">
                      <div className="text-sm whitespace-pre-wrap">{nutrition.explanation}</div>
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-gray-500">
                      ※ AI解説を有効にするには <code>OPENAI_API_KEY</code> を設定してください。
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">この日の記録がまだありません。</div>
              )}
            </section>
          )}
        </div>

        <div className="p-4 border-t dark:border-zinc-700 text-right">
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-zinc-700 border dark:border-zinc-600 mr-2"
            onClick={() => onClose(changed)}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function gOrQ(v?: number) {
  return v == null ? "—" : `${Math.round(v * 10) / 10} g`;
}
function sign(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function CardStat({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string;
  tone?: "plain" | "ok" | "warn" | "bad";
}) {
  const toneCls =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
      : tone === "bad"
      ? "bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-200"
      : "bg-gray-50 text-gray-900 dark:bg-zinc-900/40 dark:text-gray-100";
  return (
    <div className={`p-3 rounded border dark:border-zinc-700 ${toneCls}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

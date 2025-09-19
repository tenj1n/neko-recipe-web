"use client";

import { useEffect, useState } from "react";

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

type Nutrition = {
  totals: { kcal: number; protein_g?: number; fat_g?: number; fiber_g?: number };
  targets: { kcal: number; protein_g?: number; fat_g?: number };
  diff: { kcal: number; protein_g?: number; fat_g?: number };
  explanation?: string;
};

import type { DaySummary } from "./types";
import { SLOTS, SLOT_LABEL_JA, type Slot } from "./types";

const inputCute = "input-cute w-full mt-1";

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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white text-[#171717] w-full sm:w-[980px] max-h-[90vh]
                   rounded-t-2xl sm:rounded-2xl shadow-soft overflow-auto"
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold"> {dateYmd} の記録</h2>
          <button
            className="nav-pill focus-ring tap-target paw-hover text-sm"
            onClick={() => onClose(changed)}
          >
            閉じる
          </button>
        </div>

        {/* トースト */}
        {toast && (
          <div
            className={`mx-4 mt-3 px-3 py-2 rounded text-sm border ${
              toast.kind === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
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
              className={`nav-pill focus-ring tap-target ${
                activeTab === "stool" ? "btn-primary-cute" : ""
              }`}
            >
              うんちログ
            </button>
            <button
              onClick={() => setActiveTab("meal")}
              className={`nav-pill focus-ring tap-target ${
                activeTab === "meal" ? "btn-primary-cute" : ""
              }`}
            >
              食事入力
            </button>
            <button
              onClick={() => fetchNutrition().then(() => setActiveTab("nutrition"))}
              className={`nav-pill focus-ring tap-target ${
                activeTab === "nutrition" ? "btn-primary-cute" : ""
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
            <section className="border border-zinc-200 rounded-xl p-4 bg-white">
              <h3 className="font-semibold mb-3">うんちログ</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  状態
                  <select
                    className={inputCute}
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
                    className={inputCute}
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
                    className={inputCute}
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
                    className={`${inputCute} min-h-[100px]`}
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
                  className="btn-primary-cute focus-ring tap-target"
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
            <section className="border border-zinc-200 rounded-xl p-4 bg-white">
              <h3 className="font-semibold mb-3">食事スロット</h3>
              <div className="space-y-6">
                {SLOTS.map((slot) => (
                  <div key={slot} className="border border-zinc-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{SLOT_LABEL_JA[slot]}</div>
                      <button
                        className="btn-primary-cute focus-ring tap-target"
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

                    <label className="block text-xs text-[#5A5A5A] mb-1">メモ</label>
                    <input
                      className={inputCute}
                      placeholder="食いつき良い / 吐き戻しなし など"
                      value={slotNotes[slot] ?? ""}
                      onChange={(e) => {
                        setSlotNotes((s) => ({ ...s, [slot]: e.target.value }));
                        setChanged(true);
                      }}
                    />

                    <div className="space-y-2 mt-2">
                      {(slotItems[slot] ?? []).map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            className={`${inputCute} w-[50%]`}
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
                            className={`${inputCute} w-[20%]`}
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
                            className={`${inputCute} w-[20%]`}
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
                            className="btn-cute focus-ring tap-target"
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
                        className="btn-cute focus-ring tap-target"
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
                      <span className="text-xs text-[#9B8C86]">
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
            <section className="border border-zinc-200 rounded-xl p-4 bg-white lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">栄養サマリ（{dateYmd}）</h3>
                <button
                  className="btn-cute focus-ring tap-target text-sm"
                  onClick={() => fetchNutrition()}
                >
                  再計算
                </button>
              </div>

              {loadingNut ? (
                <div className="text-sm text-[#5A5A5A]">計算中…</div>
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
                    <div className="mt-4 p-3 rounded bg-violet-50 text-violet-900">
                      <div className="text-sm whitespace-pre-wrap">{nutrition.explanation}</div>
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-[#5A5A5A]">
                      ※ AI解説を有効にするには <code>OPENAI_API_KEY</code> を設定してください。
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-[#5A5A5A]">この日の記録がまだありません。</div>
              )}
            </section>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 text-right">
          <button
            className="nav-pill focus-ring tap-target"
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
      ? "bg-emerald-50 text-emerald-900"
      : tone === "warn"
      ? "bg-amber-50 text-amber-900"
      : tone === "bad"
      ? "bg-rose-50 text-rose-900"
      : "bg-gray-50 text-gray-900";
  return (
    <div className={`p-3 rounded border border-zinc-200 ${toneCls}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

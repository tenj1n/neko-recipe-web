"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Activity = "LOW" | "NORMAL" | "HIGH";

export type CatForEdit = {
  id: string;
  name: string;
  weightKg: number;
  ageYears: number;
  activity: Activity;
  sex: string;
  hairAmount: string;
  size: string;
  neutered: boolean;
  allergies: string | null;
};

// 表示ラベルは日本語、保存値は英語列挙を維持
const ACTIVITY_OPTIONS = [
  { value: "LOW" as const,    label: "低め" },
  { value: "NORMAL" as const, label: "普通" },
  { value: "HIGH" as const,   label: "高め" },
];

export default function CatEditor({ initialCat }: { initialCat: CatForEdit }) {
  const router = useRouter();
  const [cat, setCat] = useState<CatForEdit>(initialCat);
  const [msg, setMsg] = useState<string>("");
  const [saving, startSaving] = useTransition();

  async function save() {
    setMsg("");
    const res = await fetch(`/api/cat/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cat.name,
        weightKg: Number(cat.weightKg),
        ageYears: Number(cat.ageYears),
        activity: cat.activity, // ← 値は英語列挙のまま送る
        sex: cat.sex,
        hairAmount: cat.hairAmount,
        size: cat.size,
        neutered: !!cat.neutered,
        allergies: cat.allergies ?? "",
      }),
    });
    if (res.ok) {
      setMsg("保存しました。");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg(`保存に失敗しました：${j?.error ?? res.statusText}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          名前
          <input
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.name}
            onChange={(e) => setCat({ ...cat, name: e.target.value })}
          />
        </label>

        <label className="text-sm">
          体重(kg)
          <input
            type="number"
            step="0.1"
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.weightKg}
            onChange={(e) => setCat({ ...cat, weightKg: Number(e.target.value) })}
          />
        </label>

        <label className="text-sm">
          年齢(歳)
          <input
            type="number"
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.ageYears}
            onChange={(e) => setCat({ ...cat, ageYears: Number(e.target.value) })}
          />
        </label>

        <label className="text-sm">
          活動量
          <select
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.activity}
            onChange={(e) => setCat({ ...cat, activity: e.target.value as Activity })}
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          性別
          <input
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.sex}
            onChange={(e) => setCat({ ...cat, sex: e.target.value })}
          />
        </label>

        <label className="text-sm">
          抜け毛量
          <input
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.hairAmount}
            onChange={(e) => setCat({ ...cat, hairAmount: e.target.value })}
          />
        </label>

        <label className="text-sm">
          体格
          <input
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.size}
            onChange={(e) => setCat({ ...cat, size: e.target.value })}
          />
        </label>

        <label className="text-sm inline-flex items-center gap-2 mt-7">
          <input
            type="checkbox"
            checked={cat.neutered}
            onChange={(e) => setCat({ ...cat, neutered: e.target.checked })}
          />
          避妊/去勢済み
        </label>

        <label className="text-sm col-span-1 sm:col-span-2">
          アレルギー
          <input
            className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-900/60"
            value={cat.allergies ?? ""}
            onChange={(e) => setCat({ ...cat, allergies: e.target.value })}
          />
        </label>
      </div>

      {msg && (
        <div className="text-sm px-3 py-2 rounded border dark:border-zinc-700">
          {msg}
        </div>
      )}

      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          disabled={saving}
          onClick={() => startSaving(save)}
        >
          {saving ? "保存中…" : "保存する"}
        </button>
        <button
          className="px-4 py-2 rounded border"
          onClick={() => history.back()}
        >
          戻る
        </button>
      </div>
    </div>
  );
}

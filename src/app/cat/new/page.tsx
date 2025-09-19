// src/app/cat/new/page.tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Activity = "LOW" | "NORMAL" | "HIGH";

const ACTIVITY_OPTIONS = [
  { value: "LOW" as const,    label: "低め" },
  { value: "NORMAL" as const, label: "普通" },
  { value: "HIGH" as const,   label: "高め" },
];

type NewCat = {
  name: string;
  weightKg?: number | null;
  ageYears?: number | null;
  activity?: Activity;
  sex?: string;
  hairAmount?: string;
  size?: string;
  neutered?: boolean;
  allergies?: string | null;
};

export default function NewCatPage() {
  const router = useRouter();
  const [saving, startSaving] = useTransition();

  // 入力状態
  const [cat, setCat] = useState<NewCat>({
    name: "",
    weightKg: undefined,
    ageYears: undefined,
    activity: undefined,
    sex: "",
    hairAmount: "",
    size: "",
    neutered: false,
    allergies: "",
  });

  // 画像
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function onPickFile() {
    fileInputRef.current?.click();
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function createCat() {
    // 1) まず猫を作成
    const res = await fetch("/api/cat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cat.name,
        weightKg: cat.weightKg != null && cat.weightKg !== ("" as any) ? Number(cat.weightKg) : undefined,
        ageYears: cat.ageYears != null && cat.ageYears !== ("" as any) ? Number(cat.ageYears) : undefined,
        activity: cat.activity ?? undefined,
        sex: cat.sex || undefined,
        hairAmount: cat.hairAmount || undefined,
        size: cat.size || undefined,
        neutered: !!cat.neutered,
        allergies: cat.allergies ?? undefined,
      }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "作成に失敗しました");
    }

    const created = await res.json().catch(() => ({} as any));
    const newId: string =
      String(created?.id ?? created?.cat?.id ?? created?.data?.id ?? "");

    if (!newId) throw new Error("作成結果からIDを取得できませんでした。");

    // 2) 画像が選ばれていれば、既存の編集と同じエンドポイントにPUT
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch(`/api/cat/${newId}/avatar`, { method: "PUT", body: fd });
      if (!up.ok) {
        // 画像だけ失敗しても本体は作られているので、詳細へは遷移する
        console.warn("画像のアップロードに失敗:", await up.text().catch(() => ""));
      }
    }

    // 3) 作成後は詳細ページへ
    router.push(`/cat/${newId}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-2xl">新規猫プロフィール</h1>
      </div>

      {/* アバター */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="猫の画像"
          className="relative w-16 h-16 rounded-full border border-[rgba(122,93,82,.25)] bg-white shadow-soft overflow-hidden paw-hover"
          onClick={onPickFile}
        >
          {previewUrl ? (
            // プレビュー
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            // デフォルト（足跡）
            <span className="absolute inset-0 grid place-items-center text-2xl">🐾</span>
          )}
        </button>
        <button
          type="button"
          onClick={onPickFile}
          className="btn-cute focus-ring tap-target paw-hover text-sm"
        >
          画像を選ぶ
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* 入力フォーム */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          名前
          <input
            className="input-cute w-full mt-1"
            value={cat.name}
            onChange={(e) => setCat({ ...cat, name: e.target.value })}
          />
        </label>

        <label className="text-sm">
          体重(kg)
          <input
            type="number"
            step="0.1"
            className="input-cute w-full mt-1"
            value={cat.weightKg ?? ""}
            onChange={(e) => setCat({ ...cat, weightKg: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </label>

        <label className="text-sm">
          年齢(年)
          <input
            type="number"
            className="input-cute w-full mt-1"
            value={cat.ageYears ?? ""}
            onChange={(e) => setCat({ ...cat, ageYears: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </label>

        <label className="text-sm">
          活動量
          <select
            className="input-cute w-full mt-1"
            value={cat.activity ?? ""}
            onChange={(e) => setCat({ ...cat, activity: (e.target.value || undefined) as Activity })}
          >
            <option value="">選択してください</option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          性別
          <input
            className="input-cute w-full mt-1"
            placeholder="オス / メス / 不明 など"
            value={cat.sex ?? ""}
            onChange={(e) => setCat({ ...cat, sex: e.target.value })}
          />
        </label>

        <label className="text-sm">
          抜け毛量
          <input
            className="input-cute w-full mt-1"
            placeholder="少ない / 普通 / 多い など"
            value={cat.hairAmount ?? ""}
            onChange={(e) => setCat({ ...cat, hairAmount: e.target.value })}
          />
        </label>

        <label className="text-sm">
          体格
          <input
            className="input-cute w-full mt-1"
            placeholder="小型 / 中型 / 大型 など"
            value={cat.size ?? ""}
            onChange={(e) => setCat({ ...cat, size: e.target.value })}
          />
        </label>

        <label className="text-sm inline-flex items-center gap-2 mt-7">
          <input
            type="checkbox"
            checked={!!cat.neutered}
            onChange={(e) => setCat({ ...cat, neutered: e.target.checked })}
          />
          避妊/去勢済み
        </label>

        <label className="text-sm col-span-1 sm:col-span-2">
          アレルギー
          <input
            className="input-cute w-full mt-1"
            placeholder="例: 鶏, 小麦"
            value={cat.allergies ?? ""}
            onChange={(e) => setCat({ ...cat, allergies: e.target.value })}
          />
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          className="btn-cute btn-primary-cute focus-ring tap-target paw-hover px-5 disabled:opacity-60"
          disabled={saving || !cat.name.trim()}
          onClick={() => startSaving(createCat)}
        >
          {saving ? "登録中…" : "登録"}
        </button>
        <button
          className="btn-cute focus-ring tap-target paw-hover"
          onClick={() => router.back()}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

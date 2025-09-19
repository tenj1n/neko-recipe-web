//components/cat/CatEditor.tsx
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
  avatarUrl?: string | null; // ← 追加: 既存データがあれば表示
};

const ACTIVITY_OPTIONS = [
  { value: "LOW" as const,    label: "低め" },
  { value: "NORMAL" as const, label: "普通" },
  { value: "HIGH" as const,   label: "高め" },
];

// 画像→DataURL(幅上限800pxで軽量化)
async function fileToDataUrl(file: File, maxW = 800): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });
  const scale = Math.min(1, maxW / img.width);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function CatEditor({ initialCat }: { initialCat: CatForEdit }) {
  const router = useRouter();
  const [cat, setCat] = useState<CatForEdit>(initialCat);
  const [msg, setMsg] = useState<string>("");
  const [saving, startSaving] = useTransition();

  // 画像UI
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialCat.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  async function save() {
    setMsg("");

    let avatarDataUrl: string | undefined;
    if (avatarFile) {
      try {
        avatarDataUrl = await fileToDataUrl(avatarFile, 800);
      } catch {
        // 変換失敗時はスキップ（既存保存は継続）
      }
    }

    const res = await fetch(`/api/cat/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cat.name,
        weightKg: Number(cat.weightKg),
        ageYears: Number(cat.ageYears),
        activity: cat.activity,
        sex: cat.sex,
        hairAmount: cat.hairAmount,
        size: cat.size,
        neutered: !!cat.neutered,
        allergies: cat.allergies ?? "",
        avatarDataUrl, // ← 追加（API 側で未対応でも無害）
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
      {/* 画像アップロード */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#FADADD]/60 flex items-center justify-center border">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🐾</span>
          )}
        </div>
        <div className="space-x-2">
          <label className="btn-cute cursor-pointer">
            画像を選ぶ
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0] ?? null;
                setAvatarFile(f);
                setAvatarPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
          </label>
          {avatarPreview && (
            <button
              className="btn-cute"
              onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
            >
              クリア
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          名前
          <input
            className="mt-1 w-full input-cute"
            value={cat.name}
            onChange={(e) => setCat({ ...cat, name: e.target.value })}
          />
        </label>

        <label className="text-sm">
          体重(kg)
          <input
            type="number"
            step="0.1"
            className="mt-1 w-full input-cute"
            value={cat.weightKg}
            onChange={(e) => setCat({ ...cat, weightKg: Number(e.target.value) })}
          />
        </label>

        <label className="text-sm">
          年齢(歳)
          <input
            type="number"
            className="mt-1 w-full input-cute"
            value={cat.ageYears}
            onChange={(e) => setCat({ ...cat, ageYears: Number(e.target.value) })}
          />
        </label>

        <label className="text-sm">
          活動量
          <select
            className="mt-1 w-full input-cute"
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
            className="mt-1 w-full input-cute"
            value={cat.sex}
            onChange={(e) => setCat({ ...cat, sex: e.target.value })}
          />
        </label>

        <label className="text-sm">
          抜け毛量
          <input
            className="mt-1 w-full input-cute"
            value={cat.hairAmount}
            onChange={(e) => setCat({ ...cat, hairAmount: e.target.value })}
          />
        </label>

        <label className="text-sm">
          体格
          <input
            className="mt-1 w-full input-cute"
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
            className="mt-1 w-full input-cute"
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
          className="btn-cute btn-primary-cute"
          disabled={saving}
          onClick={() => startSaving(save)}
        >
          {saving ? "保存中…" : "保存する"}
        </button>
        <button
          className="btn-cute"
          onClick={() => history.back()}
        >
          戻る
        </button>
      </div>
    </div>
  );
}

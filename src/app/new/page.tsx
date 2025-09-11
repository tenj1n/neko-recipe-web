"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 画面側の union 型（Zodの .Enum は使わない）
type Activity = "LOW" | "NORMAL" | "HIGH";
type Sex = "オス" | "メス" | "不明";
type HairAmount = "少ない" | "普通" | "多い";
type Size = "小型" | "中型" | "大型";

export default function NewCatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    weightKg: 3,
    ageYears: 2,
    activity: "NORMAL" as Activity,
    sex: "不明" as Sex,
    hairAmount: "普通" as HairAmount,
    size: "中型" as Size,
    neutered: false,
    allergies: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/cats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          weightKg: Number(form.weightKg),
          ageYears: Number(form.ageYears),
          activity: form.activity,
          sex: form.sex,
          hairAmount: form.hairAmount,
          size: form.size,
          neutered: !!form.neutered,
          allergies: form.allergies.trim() || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      router.push("/");
    } catch (e: any) {
      setErr(e.message || "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-lg font-semibold mb-4">猫を登録</h1>

      {err && <div className="mb-3 text-sm text-red-500">エラー: {err}</div>}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">名前</label>
          <input
            className="w-full rounded border px-3 py-2 bg-zinc-900"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">体重(kg)</label>
            <input
              type="number"
              step="0.1"
              min={0.5}
              className="w-full rounded border px-3 py-2 bg-zinc-900"
              value={form.weightKg}
              onChange={(e) =>
                setForm({ ...form, weightKg: Number(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">年齢(歳)</label>
            <input
              type="number"
              min={0}
              className="w-full rounded border px-3 py-2 bg-zinc-900"
              value={form.ageYears}
              onChange={(e) =>
                setForm({ ...form, ageYears: Number(e.target.value) })
              }
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">活動量</label>
            <select
              className="w-full rounded border px-3 py-2 bg-zinc-900"
              value={form.activity}
              onChange={(e) =>
                setForm({ ...form, activity: e.target.value as Activity })
              }
            >
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">性別</label>
            <select
              className="w-full rounded border px-3 py-2 bg-zinc-900"
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value as Sex })}
            >
              <option value="オス">オス</option>
              <option value="メス">メス</option>
              <option value="不明">不明</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">毛量</label>
            <select
              className="w-full rounded border px-3 py-2 bg-zinc-900"
              value={form.hairAmount}
              onChange={(e) =>
                setForm({
                  ...form,
                  hairAmount: e.target.value as HairAmount,
                })
              }
            >
              <option value="少ない">少ない</option>
              <option value="普通">普通</option>
              <option value="多い">多い</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">体格</label>
            <select
              className="w-full rounded border px-3 py-2 bg-zinc-900"
              value={form.size}
              onChange={(e) =>
                setForm({ ...form, size: e.target.value as Size })
              }
            >
              <option value="小型">小型</option>
              <option value="中型">中型</option>
              <option value="大型">大型</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="neutered"
            type="checkbox"
            className="h-4 w-4"
            checked={form.neutered}
            onChange={(e) =>
              setForm({ ...form, neutered: e.target.checked })
            }
          />
          <label htmlFor="neutered" className="text-sm">
            避妊・去勢済み
          </label>
        </div>

        <div>
          <label className="block text-sm mb-1">アレルギー等</label>
          <input
            className="w-full rounded border px-3 py-2 bg-zinc-900"
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder="任意"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {loading ? "送信中…" : "登録する"}
          </button>
        </div>
      </form>
    </div>
  );
}

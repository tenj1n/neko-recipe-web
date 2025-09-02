"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  catCreateSchema,
  activityEnum,
  sexEnum,
  hairAmountEnum,
  sizeEnum,
} from "@/lib/catSchema";

export default function CatNewPage() {
  const r = useRouter();
  const [form, setForm] = useState({
    name: "",
    weightKg: "",
    ageYears: "",
    activity: "NORMAL",
    sex: "不明",
    hairAmount: "普通",
    size: "中型",
    neutered: "false", // UI上は文字で管理（"true"/"false"）
    allergies: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setMsg(null);
    setLoading(true);

    // 文字 → 型 変換して検証
    const candidate = {
      name: form.name.trim(),
      weightKg: Number(form.weightKg),
      ageYears: Number.parseInt(form.ageYears),
      activity: form.activity as (typeof activityEnum)["Enum"][keyof typeof activityEnum["Enum"]],
      sex: form.sex as (typeof sexEnum)["Enum"][keyof typeof sexEnum["Enum"]],
      hairAmount:
        form.hairAmount as (typeof hairAmountEnum)["Enum"][keyof typeof hairAmountEnum["Enum"]],
      size: form.size as (typeof sizeEnum)["Enum"][keyof typeof sizeEnum["Enum"]],
      neutered: form.neutered === "true",
      allergies: form.allergies,
    };

    const parsed = catCreateSchema.safeParse(candidate);
    if (!parsed.success) {
      // 最初のエラーだけでも十分だが、複数拾う
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString() ?? "_";
        if (!map[k]) map[k] = issue.message;
      }
      setErrors(map);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/cat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        r.push("/api/cat"); // そのままJSON確認に遷移（後で一覧に戻すなら /cat に）
      } else {
        const j = await res.json().catch(() => ({}));
        setMsg(j?.error ?? "登録に失敗しました");
      }
    } catch {
      setMsg("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">猫プロフィール登録</h1>

        <Field label="名前" error={errors.name}>
          <input
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="ミルク"
            maxLength={30}
            required
          />
        </Field>

        <Field label="体重 (kg)" error={errors.weightKg}>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0.5}
            max={15}
            className="w-full border p-2 rounded"
            value={form.weightKg}
            onChange={(e) => set("weightKg", e.target.value)}
            placeholder="4.2"
            required
          />
        </Field>

        <Field label="年齢 (歳)" error={errors.ageYears}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            className="w-full border p-2 rounded"
            value={form.ageYears}
            onChange={(e) => set("ageYears", e.target.value)}
            placeholder="2"
            required
          />
        </Field>

        <Field label="活動量" error={errors.activity}>
          <select
            className="w-full border p-2 rounded"
            value={form.activity}
            onChange={(e) => set("activity", e.target.value)}
          >
            <option value="LOW">低い</option>
            <option value="NORMAL">普通</option>
            <option value="HIGH">高い</option>
          </select>
        </Field>

        <Field label="性別" error={errors.sex}>
          <select
            className="w-full border p-2 rounded"
            value={form.sex}
            onChange={(e) => set("sex", e.target.value)}
          >
            <option>不明</option>
            <option>オス</option>
            <option>メス</option>
          </select>
        </Field>

        <Field label="毛の量" error={errors.hairAmount}>
          <select
            className="w-full border p-2 rounded"
            value={form.hairAmount}
            onChange={(e) => set("hairAmount", e.target.value)}
          >
            <option>少ない</option>
            <option>普通</option>
            <option>多い</option>
          </select>
        </Field>

        <Field label="大きさ" error={errors.size}>
          <select
            className="w-full border p-2 rounded"
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
          >
            <option>小型</option>
            <option>中型</option>
            <option>大型</option>
          </select>
        </Field>

        <Field label="去勢・避妊" error={errors.neutered}>
          <select
            className="w-full border p-2 rounded"
            value={form.neutered}
            onChange={(e) => set("neutered", e.target.value)}
          >
            <option value="false">未</option>
            <option value="true">済み</option>
          </select>
        </Field>

        <Field label="アレルギー" error={errors.allergies}>
          <input
            className="w-full border p-2 rounded"
            value={form.allergies}
            onChange={(e) => set("allergies", e.target.value)}
            placeholder="鶏, 小麦 など（200文字以内）"
            maxLength={200}
          />
        </Field>

        {msg && <p className="text-red-500 text-sm">{msg}</p>}

        <div className="flex gap-3">
          <button
            className="border px-4 py-2 rounded font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "登録中..." : "登録"}
          </button>
          <button
            type="button"
            className="border px-4 py-2 rounded"
            onClick={() => history.back()}
          >
            戻る
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { activityEnum, sexEnum, hairAmountEnum, sizeEnum, catCreateSchema } from "@/lib/catSchema";

type Cat = {
  id: string;
  name: string;
  weightKg: number;
  ageYears: number;
  activity: z.infer<typeof activityEnum>;
  sex: z.infer<typeof sexEnum> | null;
  hairAmount: z.infer<typeof hairAmountEnum> | null;
  size: z.infer<typeof sizeEnum> | null;
  neutered: boolean | null;   // ← 単一フラグ
  allergies: string | null;
  createdAt: string;
};

export default function CatEditPage() {
  const router = useRouter();
  const p = useParams<{ id: string | string[] }>();
  const id = useMemo(() => (Array.isArray(p.id) ? p.id[0] : p.id), [p.id]);

  const [form, setForm] = useState<Partial<Cat>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/cat/${id}`, { cache: "no-store" });
        if (!res.ok) {
          let err = `取得に失敗しました (${res.status})`;
          try {
            const j = await res.json();
            if (j?.error) err = j.error;
          } catch {}
          throw new Error(err);
        }
        const data: Cat = await res.json();
        setForm(data);
      } catch (e: any) {
        setMsg(e.message ?? "エラーが発生しました");
      }
    })();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const el = e.target;
    const name = el.name;
    const value = el instanceof HTMLInputElement && el.type === "checkbox" ? el.checked : el.value;
    setForm((prev) => ({ ...prev, [name]: value as any }));
  }

  async function handleUpdate() {
    if (!id) return;
    setMsg(null);

    if (!window.confirm("保存してよろしいですか？")) return;

    // 送信前に同じスキーマで軽くチェック（型の取り違いを早期検出）
    const parsed = catCreateSchema.safeParse({
      ...form,
      weightKg: Number(form.weightKg),
      ageYears: Number(form.ageYears),
      sex: form.sex ?? "不明",
      hairAmount: form.hairAmount ?? "普通",
      size: form.size ?? "中型",
      neutered: !!form.neutered,
      allergies: form.allergies ?? "",
      activity: (form.activity ?? "NORMAL") as z.infer<typeof activityEnum>,
    });
    if (!parsed.success) {
      setMsg(parsed.error.issues[0]?.message ?? "入力が正しくありません");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cat/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        let err = `保存に失敗しました (${res.status})`;
        try {
          const j = await res.json();
          if (j?.error) err = j.error;
        } catch {}
        throw new Error(err);
      }

      router.push("/cat");
    } catch (e: any) {
      setMsg(e.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (!form) return <p>読み込み中...</p>;

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">猫プロフィール編集</h1>

      <div className="space-y-3">
        <L label="名前">
          <input name="name" value={form.name ?? ""} onChange={handleChange} className="border p-2 rounded w-full" />
        </L>

        <L label="体重 (kg)">
          <input name="weightKg" type="number" value={form.weightKg ?? ""} onChange={handleChange} className="border p-2 rounded w-full" />
        </L>

        <L label="年齢 (年)">
          <input name="ageYears" type="number" value={form.ageYears ?? ""} onChange={handleChange} className="border p-2 rounded w-full" />
        </L>

        <L label="活動量">
          <select name="activity" value={form.activity ?? "NORMAL"} onChange={handleChange} className="border p-2 rounded w-full">
            {activityEnum.options.map((v) => (
              <option key={v} value={v}>{v === "LOW" ? "低い" : v === "HIGH" ? "高い" : "普通"}</option>
            ))}
          </select>
        </L>

        <L label="性別">
          <select name="sex" value={form.sex ?? "不明"} onChange={handleChange} className="border p-2 rounded w-full">
            {sexEnum.options.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </L>

        <L label="毛の量">
          <select name="hairAmount" value={form.hairAmount ?? "普通"} onChange={handleChange} className="border p-2 rounded w-full">
            {hairAmountEnum.options.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </L>

        <L label="大きさ">
          <select name="size" value={form.size ?? "中型"} onChange={handleChange} className="border p-2 rounded w-full">
            {sizeEnum.options.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </L>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="neutered" checked={!!form.neutered} onChange={handleChange} />
          繁殖防止済み（去勢または避妊）
        </label>

        <L label="アレルギー">
          <input name="allergies" value={form.allergies ?? ""} onChange={handleChange} className="border p-2 rounded w-full" />
        </L>

        {msg && <Alert text={msg} />}

        <div className="flex gap-2">
          <button onClick={handleUpdate} disabled={loading} className="border px-4 py-2 rounded font-semibold bg-blue-500 text-white disabled:opacity-60">
            {loading ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            className="border px-4 py-2 rounded"
            onClick={() => {
              if (window.confirm("変更は保存されません。一覧に戻りますか？")) router.push("/cat");
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </main>
  );
}

function L(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-medium">{props.label}</span>
      {props.children}
    </label>
  );
}
function Alert({ text }: { text: string }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 p-2 rounded">
      <p className="font-semibold">エラー</p>
      <p>{text}</p>
    </div>
  );
}

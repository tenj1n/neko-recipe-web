// src/app/cat/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { z } from "zod"; // ★ 追加

import {
  catCreateSchema,
  activityEnum,
  sexEnum,
  hairAmountEnum,
  sizeEnum,
} from "@/lib/catSchema";

type Cat = {
  id: string;
  name: string;
  weightKg: number;
  ageYears: number;
  activity: z.infer<typeof activityEnum>;
  sex: z.infer<typeof sexEnum> | null;
  hairAmount: z.infer<typeof hairAmountEnum> | null;
  size: z.infer<typeof sizeEnum> | null;
  neutered: boolean | null;
  allergies: string | null;
  createdAt: string;
};

// フォーム用の型（入力は string で保持 → 送信時に number/boolean へ変換）
type Form = {
  name: string;
  weightKg: string;
  ageYears: string;
  activity: z.infer<typeof activityEnum>;
  sex: z.infer<typeof sexEnum>;
  hairAmount: z.infer<typeof hairAmountEnum>;
  size: z.infer<typeof sizeEnum>;
  neutered: boolean;
  allergies: string;
};

type FieldErrors = Partial<Record<keyof Form, string>>;

export default function CatNewPage() {
  const router = useRouter();
  const { status } = useSession();

  // 未ログインなら /login へ
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const [form, setForm] = useState<Form>({
    name: "",
    weightKg: "",
    ageYears: "",
    activity: "NORMAL",
    sex: "不明",
    hairAmount: "普通",
    size: "中型",
    neutered: false,
    allergies: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const el = e.target;
    const name = el.name as keyof Form;
    const value =
      el instanceof HTMLInputElement && el.type === "checkbox"
        ? el.checked
        : el.value;
    setForm((prev) => ({ ...prev, [name]: value as any }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErrors({});

    // 送信前に確認
    const ok = window.confirm("この内容で登録します。よろしいですか？");
    if (!ok) return;

    setLoading(true);
    try {
      // 文字→数/真偽 変換してバリデーション
      const parsed = catCreateSchema.safeParse({
        ...form,
        weightKg: Number(form.weightKg),
        ageYears: Number(form.ageYears),
        neutered: !!form.neutered,
      });

      if (!parsed.success) {
        // フィールド毎にエラーを並べる
        const map: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof Form | undefined;
          if (key) map[key] = issue.message;
        }
        setErrors(map);
        setMsg("入力内容を確認してください。");
        return;
      }

      const res = await fetch("/api/cat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        let err = `登録に失敗しました (${res.status})`;
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

  // Enter での誤送信を防止（入力中の Enter は無効）
  function preventEnterSubmit(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-6">
      <Header />

      <h1 className="text-2xl font-bold">猫プロフィールを追加</h1>

      {msg && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-2 rounded">
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="space-y-3">
        <label className="block">
          <span className="font-medium">名前</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </label>

        <label className="block">
          <span className="font-medium">体重(kg)</span>
          <input
            name="weightKg"
            value={form.weightKg}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            inputMode="decimal"
          />
          {errors.weightKg && (
            <p className="text-red-500 text-sm">{errors.weightKg}</p>
          )}
        </label>

        <label className="block">
          <span className="font-medium">年齢(年)</span>
          <input
            name="ageYears"
            value={form.ageYears}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            inputMode="numeric"
          />
          {errors.ageYears && (
            <p className="text-red-500 text-sm">{errors.ageYears}</p>
          )}
        </label>

        <label className="block">
          <span className="font-medium">活動量</span>
          <select
            name="activity"
            value={form.activity}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            {activityEnum.options.map((v) => (
              <option key={v} value={v}>
                {v === "LOW" ? "低い" : v === "HIGH" ? "高い" : "普通"}
              </option>
            ))}
          </select>
          {errors.activity && (
            <p className="text-red-500 text-sm">{errors.activity}</p>
          )}
        </label>

        <label className="block">
          <span className="font-medium">性別</span>
          <select
            name="sex"
            value={form.sex}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            {sexEnum.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {errors.sex && <p className="text-red-500 text-sm">{errors.sex}</p>}
        </label>

        <label className="block">
          <span className="font-medium">毛の量</span>
          <select
            name="hairAmount"
            value={form.hairAmount}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            {hairAmountEnum.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {errors.hairAmount && (
            <p className="text-red-500 text-sm">{errors.hairAmount}</p>
          )}
        </label>

        <label className="block">
          <span className="font-medium">大きさ</span>
          <select
            name="size"
            value={form.size}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            {sizeEnum.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {errors.size && <p className="text-red-500 text-sm">{errors.size}</p>}
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="neutered"
            checked={form.neutered}
            onChange={handleChange}
          />
          繁殖防止済み（去勢または避妊）
        </label>

        <label className="block">
          <span className="font-medium">アレルギー</span>
          <input
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {errors.allergies && (
            <p className="text-red-500 text-sm">{errors.allergies}</p>
          )}
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="border px-4 py-2 rounded font-semibold bg-blue-500 text-white disabled:opacity-60"
          >
            {loading ? "登録中..." : "登録"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm("入力内容は保存されません。猫一覧に戻りますか？")) {
                router.push("/cat");
              }
            }}
            className="border px-4 py-2 rounded"
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
}

function Header() {
  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="font-semibold hover:underline">
        Neko Recipe
      </Link>
      <div className="flex gap-3">
        <Link
          href="/cat"
          className="border px-3 py-1 rounded hover:bg-white/10 transition"
        >
          一覧へ
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="border px-3 py-1 rounded"
        >
          ログアウト
        </button>
      </div>
    </nav>
  );
}

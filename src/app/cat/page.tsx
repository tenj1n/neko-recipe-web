"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Activity = "LOW" | "NORMAL" | "HIGH";

type CatRow = {
  id: string;
  name: string;
  weightKg?: number | null;
  activity?: Activity | null;
  sex?: string | null;
};

const ACTIVITY_LABEL: Record<Activity, string> = {
  LOW: "低め",
  NORMAL: "普通",
  HIGH: "高め",
};
const activityJa = (a?: Activity | null) => (a ? ACTIVITY_LABEL[a] : "—");

export default function CatListPage() {
  const [cats, setCats] = useState<CatRow[] | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cat/list", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        const arr: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.cats)
          ? (data as any).cats
          : [];

        setCats(
          arr.map((c: any) => ({
            id: String(c.id),
            name: String(c.name ?? "（名前未設定）"),
            weightKg: c.weightKg ?? null,
            activity: (c.activity as Activity | null) ?? null,
            sex: c.sex ?? null,
          }))
        );
      } catch (e: any) {
        setError(e?.message ?? "読み込みに失敗しました");
        setCats([]);
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-2xl">猫の情報</h1>
        <Link href="/cat/new" className="nav-pill focus-ring tap-target paw-hover text-sm">
          新規登録
        </Link>
      </div>

      {cats === null && (
        <div className="border border-zinc-200 rounded p-6 text-sm text-[#5A5A5A]">
          読み込み中…
        </div>
      )}

      {error && (
        <div className="border border-rose-200 rounded p-3 text-sm bg-rose-50 text-rose-900">
          {error}
        </div>
      )}

      {Array.isArray(cats) && cats.length === 0 && !error ? (
        <div className="border border-zinc-200 rounded p-6 text-sm text-[#5A5A5A]">
          登録された猫が見つかりません。右上の「新規登録」から追加してください。
        </div>
      ) : null}

      {Array.isArray(cats) && cats.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.id} className="card-cute hover-lift p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                <Link
                  href={`/cat/${c.id}`}
                  className="btn-cute focus-ring tap-target text-xs paw-hover"
                >
                  詳細・編集
                </Link>
              </div>
              <div className="text-sm text-[#5A5A5A] space-y-1">
                <div>体重: {c.weightKg != null ? `${c.weightKg} kg` : "—"}</div>
                <div>活動量: {activityJa(c.activity)}</div>
                <div>性別: {c.sex ?? "—"}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

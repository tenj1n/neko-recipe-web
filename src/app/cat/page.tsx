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

        // 返り値ゆらぎ対応
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
        <h1 className="text-2xl font-semibold">猫の情報</h1>
        <Link
          href="/cat/new"
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
        >
          新規登録
        </Link>
      </div>

      {cats === null && (
        <div className="border rounded p-6 text-sm text-gray-500 dark:text-gray-400">
          読み込み中…
        </div>
      )}

      {error && (
        <div className="border rounded p-3 text-sm bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      )}

      {Array.isArray(cats) && cats.length === 0 && !error ? (
        <div className="border rounded p-6 text-sm text-gray-500 dark:text-gray-400">
          登録された猫が見つかりません。右上の「新規登録」から追加してください。
        </div>
      ) : null}

      {Array.isArray(cats) && cats.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.id} className="border rounded p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                <Link
                  href={`/cat/${c.id}`}
                  className="text-xs px-2 py-1 rounded border"
                >
                  詳細・編集
                </Link>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
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

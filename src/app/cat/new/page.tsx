//src/app/cat/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

type Cat = {
  id: string;
  name: string;
  weightKg: number;
  ageYears: number;
  activity: "LOW" | "NORMAL" | "HIGH";
  sex?: string | null;
  hairAmount?: string | null;
  size?: string | null;
  neutered?: boolean | null;
  allergies?: string | null;
  createdAt: string;
};

export default function CatListPage() {
  const { data: session, status } = useSession();
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 未ログインなら /login へ
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  // 一覧取得
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        setError(null);
        const res = await fetch("/api/cat", { cache: "no-store" });
        if (!res.ok) throw new Error("一覧の取得に失敗しました");
        const data: Cat[] = await res.json();
        setCats(data);
      } catch (e: any) {
        setError(e.message ?? "エラーが発生しました");
      }
    })();
  }, [status]);

  if (status === "loading" || cats === null) {
    return (
      <main className="min-h-screen p-6 flex flex-col gap-4">
        <Header />
        <p>読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 flex flex-col gap-6">
      <Header />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">あなたの猫一覧</h1>
        <div className="flex gap-3">
          <Link
            href="/cat/new"
            className="border px-4 py-2 rounded font-semibold"
          >
            ＋ 新規追加
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="border px-4 py-2 rounded"
          >
            ログアウト
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {cats.length === 0 ? (
        <p className="text-sm">
          まだ登録がありません。<Link href="/cat/new" className="underline">こちら</Link>から追加してください。
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.id} className="border rounded p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                <span className="text-xs opacity-70">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p>体重: {c.weightKg} kg / 年齢: {c.ageYears} 歳</p>
                <p>活動量: {labelActivity(c.activity)}</p>
                {c.sex && <p>性別: {c.sex}</p>}
                {c.hairAmount && <p>毛の量: {c.hairAmount}</p>}
                {c.size && <p>大きさ: {c.size}</p>}
                {typeof c.neutered === "boolean" && (
                  <p>去勢・避妊: {c.neutered ? "済み" : "未"}</p>
                )}
                {c.allergies && <p>アレルギー: {c.allergies}</p>}
              </div>
              {/* 将来: 編集/削除ボタンをここに置く */}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function labelActivity(a: Cat["activity"]) {
  return a === "LOW" ? "低い" : a === "HIGH" ? "高い" : "普通";
}

function Header() {
  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="font-semibold hover:underline">
        Neko Recipe
      </Link>
      <div className="text-sm opacity-70">/cat</div>
    </nav>
  );
}

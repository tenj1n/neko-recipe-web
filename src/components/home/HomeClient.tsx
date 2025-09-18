// src/components/home/HomeClient.tsx
"use client";

import Link from "next/link";
import { useActiveCat } from "@/hooks/useActiveCat";

type Props = { sessionEmail: string | null };

type Tile = { href: string; title: string; desc: string; emoji: string };

export default function HomeClient({ sessionEmail }: Props) {
  const { cat, loading } = useActiveCat();

  const tiles: Tile[] = [
    { href: "/calendar", title: "カレンダー", desc: "食事とうんちを記録・確認", emoji: "🗓️" },
    { href: "/search",   title: "商品検索",   desc: "フード・おやつを検索して使う", emoji: "🪄" },
    { href: "/scan",     title: "バーコード", desc: "カメラでバーコードを読み取る", emoji: "🪪" },
    { href: "/cat/new",  title: "猫を登録",   desc: "新しい猫を登録する",        emoji: "➕" },
    { href: "/cat",      title: "猫の情報",   desc: "猫の情報を確認・変更する",   emoji: "🐾" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">ホーム</h1>

      <p className="text-sm mb-6">
        ログイン中: {sessionEmail ?? "未ログイン"}
        {cat ? <> / 猫: <span className="font-medium">{cat.name}</span></> : " / 猫: ー"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 transition p-4 block"
          >
            <div className="text-3xl mb-2">{t.emoji}</div>
            <div className="text-lg font-semibold">{t.title}</div>
            <div className="text-sm opacity-70">{t.desc}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="text-sm opacity-70 mb-2">クイックアクション</div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/calendar"
            className="text-sm px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800"
          >
            今日の記録をつける
          </Link>
          <Link
            href="/calendar"
            className="text-sm px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800"
          >
            最近の状態を確認
          </Link>
          {/* 追加のショートカット */}
          <Link
            href="/cat/new"
            className="text-sm px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800"
          >
            猫を登録
          </Link>
          <Link
            href="/cat"
            className="text-sm px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800"
          >
            猫の情報
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import CatSwitcher from "@/components/CatSwitcher";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <Link href="/" className="font-semibold">neko-recipe</Link>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="text-sm px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800"
        >
          ホーム
        </Link>

        {/* 右上：ラジオボタン式スイッチャー */}
        <CatSwitcher />
      </div>
    </header>
  );
}

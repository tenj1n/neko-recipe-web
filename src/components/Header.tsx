// src/components/Header.tsx
"use client";

import Link from "next/link";
import CatSwitcher from "@/components/CatSwitcher";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
      <Link href="/" className="font-semibold text-[--color-foreground]">
        neko-recipe
      </Link>

      {/* ▼クラス名 nav-right を追加（子の a / button を丸ごと“ピル型”に寄せる） */}
      <div className="nav-right flex items-center gap-2">
        <Link href="/" className="nav-pill focus-ring tap-target paw-hover text-sm">
          ホーム
        </Link>

        {/* そのままでOK（下のCSSが CatSwitcher の実ボタンにも適用されます） */}
        <CatSwitcher />
      </div>
    </header>
  );
}

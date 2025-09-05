// src/components/Header.tsx
"use client";

import dynamic from "next/dynamic";

// CatPicker はブラウザAPI(localStorage)を使うのでクライアント限定。
// クライアント側なら ssr:false を使ってOK。
const CatPicker = dynamic(() => import("@/components/CatPicker"), { ssr: false });

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 dark:bg-black/60 backdrop-blur px-4 py-2 flex items-center justify-between">
      <div className="font-semibold">neko-recipe</div>
      <CatPicker />
    </header>
  );
}

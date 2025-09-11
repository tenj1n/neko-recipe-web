// src/lib/useActiveCat.ts
"use client";
import { useEffect, useState } from "react";

type Cat = { id: string; name: string } | null;

export function useActiveCat() {
  const [catId, setCatId] = useState<string | null>(null);
  const [cat, setCat] = useState<Cat>(null);

  // 1) 起動時に localStorage から読む（1回だけ）
  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("activeCatId") : null;
    if (id) setCatId(id);
  }, []);

  // 2) 変更時は localStorage に保存（1回/変更）
  useEffect(() => {
    if (!catId) return;
    localStorage.setItem("activeCatId", catId);
  }, [catId]);

  // 3) catId が変わった時だけ猫詳細を1回フェッチ
  useEffect(() => {
    let aborted = false;
    (async () => {
      if (!catId) { setCat(null); return; }
      try {
        const r = await fetch(`/api/cat/${catId}`, { cache: "no-store" });
        const j = await r.json();
        if (!aborted) setCat(j);
      } catch {
        if (!aborted) setCat(null);
      }
    })();
    return () => { aborted = true; };
  }, [catId]);

  return { catId, setCatId, cat };
}

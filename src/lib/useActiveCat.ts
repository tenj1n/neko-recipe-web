// src/lib/useActiveCat.ts
"use client";
import { useEffect, useState, useCallback } from "react";

type Cat = { id: string; name: string } | null;
const LS_KEY = "activeCatId";

export function useActiveCat() {
  const [catId, setCatIdState] = useState<string | null>(null);
  const [cat, setCat] = useState<Cat>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1) 起動時 & 他タブ/同一タブ変更を取り込む
  const loadFromStorage = useCallback(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    setCatIdState(id);
  }, []);

  useEffect(() => {
    loadFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) loadFromStorage();
    };
    const onCustom = () => loadFromStorage(); // 同一タブ即時反映用
    window.addEventListener("storage", onStorage);
    window.addEventListener("active-cat-changed", onCustom as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("active-cat-changed", onCustom as any);
    };
  }, [loadFromStorage]);

  // 2) 変更時は localStorage に保存＋同一タブへ通知
  const setCatId = useCallback((id: string | null) => {
    if (id) localStorage.setItem(LS_KEY, id);
    else localStorage.removeItem(LS_KEY);
    setCatIdState(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("active-cat-changed"));
    }
  }, []);

  // 3) catId が変わったら猫情報をフェッチ
  useEffect(() => {
    let aborted = false;
    (async () => {
      if (!catId) { setCat(null); setIsLoading(false); return; }
      setIsLoading(true);
      try {
        // まず /api/debug/cats を試し、無ければ /api/cat/:id にフォールバック
        let got: Cat = null;
        try {
          const r = await fetch(`/api/debug/cats?id=${encodeURIComponent(catId)}`, { cache: "no-store" });
          const j = await r.json();
          const item = j?.cats?.[0];
          if (item) got = { id: item.id, name: item.name };
        } catch {}

        if (!got) {
          const r2 = await fetch(`/api/cat/${catId}`, { cache: "no-store" });
          const j2 = await r2.json();
          got = j2 && j2.id ? { id: j2.id, name: j2.name } : null;
        }

        if (!aborted) setCat(got);
      } catch {
        if (!aborted) setCat(null);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [catId]);

  return { catId, setCatId, cat, isLoading };
}

export default useActiveCat;

"use client";
import { useEffect, useState } from "react";

const KEY = "activeCatId";

export function useActiveCat() {
  const [catId, setCatId] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (saved) setCatId(saved);
  }, []);

  const pick = (id: string) => {
    setCatId(id);
    if (typeof window !== "undefined") localStorage.setItem(KEY, id);
  };

  return { catId, setCatId: pick };
}

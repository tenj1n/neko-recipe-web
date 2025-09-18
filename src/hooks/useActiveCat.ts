// src/hooks/useActiveCat.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export type ActiveCat = { id: string; name: string } | null;

export function useActiveCat() {
  const [cat, setCat] = useState<ActiveCat>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/me/active-cat?ts=" + Date.now(), { cache: "no-store" });
      const j = await r.json();
      setCat(j.cat ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const setActive = useCallback(async (catId: string) => {
    await fetch("/api/me/active-cat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catId }),
    });
    await refresh();
  }, [refresh]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { cat, loading, refresh, setActive };
}

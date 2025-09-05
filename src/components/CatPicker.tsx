"use client";
import { useEffect, useState } from "react";
import { useActiveCat } from "@/lib/useActiveCat";

type Cat = { id: string; name: string };

export default function CatPicker() {
  const { catId, setCatId } = useActiveCat();
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/cat"); // 既存: /api/cat (GET) 猫一覧
      const j = await r.json();
      setCats(Array.isArray(j) ? j : []);
      if (!catId && j?.[0]?.id) setCatId(j[0].id); // 初回は先頭を選択
    })();
  }, []);

  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={catId ?? ""}
      onChange={(e) => setCatId(e.target.value)}
    >
      {cats.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

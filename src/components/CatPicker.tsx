"use client";
import { useEffect, useState } from "react";
import { useActiveCat } from "@/hooks/useActiveCat";

type Cat = { id: string; name: string };

export default function CatPicker() {
  const { cat, setActive, loading } = useActiveCat();
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/cat/list", { cache: "no-store" }); // 既存の猫一覧API想定
      const j = await r.json();
      setCats(j.cats ?? []);
    })();
  }, []);

  if (loading) return <span className="text-sm opacity-70">読み込み中…</span>;

  return (
    <select
      className="border rounded px-2 py-1 bg-white dark:bg-zinc-900"
      value={cat?.id ?? ""}
      onChange={(e) => setActive(e.target.value)}
    >
      <option value="" disabled>猫を選択</option>
      {cats.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

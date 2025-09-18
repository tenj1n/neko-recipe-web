// src/components/CatSwitcher.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useActiveCat } from "@/hooks/useActiveCat";
import { useRouter } from "next/navigation";

type Cat = { id: string; name: string };

export default function CatSwitcher() {
  const { cat, refresh } = useActiveCat();
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [sel, setSel] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // ★ ここを /api/cat に統一（新規ファイル増やさない）
      const r = await fetch("/api/cat", { cache: "no-store" });
      const j = await r.json();
      const list: Cat[] = j?.cats ?? [];
      setCats(list);
      setSel(cat?.id ?? list[0]?.id ?? "");
    })();
  }, [cat?.id]);

  // 外側クリックで閉じる
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  async function apply(id: string) {
    if (!id || saving) return;
    setSaving(true);
    setMsg("");
    const r = await fetch("/api/me/active-cat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catId: id }),
    });
    setSaving(false);
    if (r.ok) {
      await refresh();   // フロント状態を更新
      router.refresh();  // サーバ側再描画（Cookie反映）
      setOpen(false);
      setMsg("✓ 猫を変更しました");
      setTimeout(() => setMsg(""), 1500);
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg(j?.error ?? "変更に失敗しました");
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        className="text-sm px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="猫を変更"
      >
        {cat ? `猫: ${cat.name}` : "猫を選択"}
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-2 z-50"
        >
          <div className="max-h-64 overflow-auto">
            {cats.length === 0 && (
              <div className="text-xs opacity-70 px-2 py-3">登録された猫がありません</div>
            )}
            {cats.map(c => (
              <label
                key={c.id}
                className="flex items-center gap-2 px-2 py-2 rounded hover:bg-zinc-800 cursor-pointer"
                onClick={() => setSel(c.id)}
              >
                <input
                  type="radio"
                  name="active-cat"
                  className="accent-blue-500"
                  checked={sel === c.id}
                  onChange={() => setSel(c.id)}
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 p-2 border-t border-zinc-700">
            <button
              className="px-3 py-1.5 rounded border border-zinc-600 text-sm"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </button>
            <button
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
              disabled={!sel || saving}
              onClick={() => apply(sel)}
            >
              {saving ? "保存中…" : "この猫にする"}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div className="absolute right-0 -bottom-8 text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
          {msg}
        </div>
      )}
    </div>
  );
}

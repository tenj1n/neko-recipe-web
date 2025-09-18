// src/components/calendar/CalendarMain.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import DayEditor from "./DayEditor";

export type DaySummary = {
  dateYmd: string;
  stool?: {
    status?: "NONE" | "NORMAL" | "SOFT" | "DIARRHEA" | "HARD";
    color?: string;
    amount?: string;
    mucus?: boolean;
    blood?: boolean;
    note?: string;
  };
  slots: {
    BREAKFAST?: { notes?: string; items?: any[] };
    LUNCH?: { notes?: string; items?: any[] };
    DINNER?: { notes?: string; items?: any[] };
    SNACK?: { notes?: string; items?: any[] };
  };
  hasMeals?: boolean;
  hasStool?: boolean;
};

const WD = ["日","月","火","水","木","金","土"] as const;
const SLOT_LABEL_JA: Record<string,string> = { BREAKFAST:"朝", LUNCH:"昼", DINNER:"夕", SNACK:"間" };
const STOOL_EMOJI: Record<string,string> = { NONE:"❌", NORMAL:"💩", SOFT:"💩💧", DIARRHEA:"💩💦", HARD:"💩🧱" };

function ymd(d: Date) {
  const z = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export default function CalendarMain() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [days, setDays] = useState<DaySummary[]>([]);
  const [editingYmd, setEditingYmd] = useState<string | null>(null);

  const start = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor]);
  const end   = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), [cursor]);

  const daysMap = useMemo(() => {
    const m = new Map<string, DaySummary>();
    for (const d of days) m.set(d.dateYmd, d);
    return m;
  }, [days]);

  async function fetchMonth() {
    const params = new URLSearchParams({ from: ymd(start), to: ymd(end) });
    const r = await fetch(`/api/calendar?${params.toString()}`, { cache: "no-store" });
    if (!r.ok) { console.error(await r.text()); setDays([]); return; }
    const j = await r.json();
    setDays(j.days ?? []);
  }

  useEffect(() => { fetchMonth(); /* eslint-disable-next-line */ }, [cursor]);

  const handleCloseEditor = (changed: boolean) => {
    setEditingYmd(null);
    if (changed) fetchMonth();
  };

  const moveMonth = (delta: number) =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  const firstWeekday = start.getDay();                  // 0..6
  const total        = end.getDate();                   // 今月の日数
  const blanks       = Array.from({ length: firstWeekday });

  return (
    <div className="space-y-4">
      {/* 月の操作 */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 rounded border" onClick={() => moveMonth(-1)}>前月</button>
        <div className="text-lg font-semibold">
          {cursor.getFullYear()}年 {cursor.getMonth() + 1}月
        </div>
        <button className="px-3 py-1 rounded border" onClick={() => moveMonth(1)}>次月</button>
      </div>

      {/* 曜日ヘッダ */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs opacity-70">
        {WD.map((w, i) => (
          <div key={i} className={i===0 ? "text-rose-400" : i===6 ? "text-sky-400" : ""}>{w}</div>
        ))}
      </div>

      {/* 月グリッド（先頭オフセット + 日） */}
      <div className="grid grid-cols-7 gap-2">
        {blanks.map((_,i) => <div key={`b${i}`} />)}

        {Array.from({ length: total }, (_, i) => {
          const d = new Date(cursor.getFullYear(), cursor.getMonth(), i + 1);
          const key = ymd(d);
          const info = daysMap.get(key);
          const hasData = !!info;

          // セル内サマリ
          const stoolBadge = info?.hasStool && info.stool?.status
            ? STOOL_EMOJI[info.stool.status] ?? "💩"
            : null;

          const mealBadges = Object.entries(SLOT_LABEL_JA)
            .filter(([slot]) => (info?.slots as any)?.[slot]?.items?.length || (info?.slots as any)?.[slot]?.notes)
            .map(([_, label]) => label)
            .slice(0, 3); // 表示しすぎ防止

          return (
            <button
              key={key}
              className={
                "text-left p-3 rounded border dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/40 " +
                "hover:bg-white hover:dark:bg-zinc-800"
              }
              onClick={() => setEditingYmd(key)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-70">{String(i + 1).padStart(2, "0")}日</div>
                {stoolBadge && <span className="text-xs">{stoolBadge}</span>}
              </div>

              <div className="mt-1">
                {hasData ? (
                  <div className="flex gap-1 flex-wrap text-[11px] opacity-80">
                    {mealBadges.length > 0
                      ? mealBadges.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-[1px] rounded bg-zinc-200/70 dark:bg-zinc-800/70">
                            🍚{t}
                          </span>
                        ))
                      : <span className="text-xs opacity-60">（うんちのみ）</span>}
                  </div>
                ) : (
                  <div className="text-xs opacity-60">（未入力）</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {editingYmd && (
        <DayEditor
          dateYmd={editingYmd}
          initialDay={daysMap.get(editingYmd)}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}

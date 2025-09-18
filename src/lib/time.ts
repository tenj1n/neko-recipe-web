// src/lib/time.ts
export function parseDateInputToDate(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input); // epoch(ms)
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

// JST(UTC+9)の 00:00 に正規化して保存用Dateを返す
export function startOfDayInJST(input: string | number | Date): Date {
  const d = parseDateInputToDate(input);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(jst.getTime() - 9 * 60 * 60 * 1000);
}

// YYYY-MM-DD 文字列（JST）を作る
export function ymdJST(d: Date): string {
  const local = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

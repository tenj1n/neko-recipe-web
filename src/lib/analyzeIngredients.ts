// src/lib/analyzeIngredients.ts
// 原材料テキストから OK/注意/NG のヒットを拾って要約を返す（エクスポート名の違いに強い実装）

// 正規化関数（あれば使う）
let normalizeTextFn: ((s: string) => string) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@/lib/textNormalize");
  normalizeTextFn = typeof mod.normalizeText === "function" ? mod.normalizeText : null;
} catch {}

import * as rules from "@/lib/ingredientRules";

// ===== 型 =====
export type HitLevel = "OK" | "CAUTION" | "NG";
export type IngredientHit = { level: HitLevel; keyword: string; index: number };
export type AnalyzeResult = {
  summary: string;
  hasNG: boolean;
  hasCaution: boolean;
  hits: IngredientHit[];
};

// ===== ルール取得（配列/Set/オブジェクト内list など柔軟に拾う）=====
function listByKind(kind: HitLevel): string[] {
  const candidates: Record<HitLevel, string[]> = {
    OK: ["okKeywords", "OK", "Ok", "ok"],
    CAUTION: ["cautionKeywords", "CAUTION", "Caution", "warn", "Warn"],
    NG: ["ngKeywords", "NG", "Ng", "bad", "Bad"],
  };

  for (const key of candidates[kind]) {
    const v = (rules as any)[key];
    if (!v) continue;
    if (Array.isArray(v)) return v as string[];
    if (v instanceof Set) return Array.from(v as Set<string>);
    if (v && Array.isArray((v as any).list)) return (v as any).list as string[];
  }
  return [];
}

// ===== 本体 =====
export function analyzeIngredients(text: string, _opts?: { catId?: string | null }): AnalyzeResult {
  const base = (text || "").trim();
  const norm = normalizeTextFn ? normalizeTextFn(base) : base;

  const ok = listByKind("OK");
  const caution = listByKind("CAUTION");
  const ng = listByKind("NG");

  const hits: IngredientHit[] = [];

  const scan = (level: HitLevel, words: string[]) => {
    for (const w of words) {
      const kw = (w || "").trim();
      if (!kw) continue;
      const idx = norm.indexOf(kw);
      if (idx >= 0) hits.push({ level, keyword: kw, index: idx });
    }
  };

  // NG優先で検出 → 注意 → OK
  scan("NG", ng);
  scan("CAUTION", caution);
  scan("OK", ok);

  const hasNG = hits.some((h) => h.level === "NG");
  const hasCaution = !hasNG && hits.some((h) => h.level === "CAUTION");

  const summary = hasNG
    ? "NG食材が含まれる可能性"
    : hasCaution
    ? "注意食材の可能性"
    : "OK食材のみの可能性";

  return { summary, hasNG, hasCaution, hits };
}

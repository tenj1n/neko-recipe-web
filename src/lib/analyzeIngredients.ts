// src/lib/analyzeIngredients.ts

import { OK, CAUTION, NG, NORMALIZE_MAP } from "./ingredientRules";

export type PrefLevel = "OK" | "CAUTION" | "NG";
export type PrefMap = Record<string, PrefLevel>;

// =========================
// 基本ルールで解析
// =========================
export function analyze(ingredientsText: string) {
  const words = splitIngredientsToWords(ingredientsText);

  const tokens: { word: string; norm: string; level: PrefLevel }[] = [];

  for (const w of words) {
    const norm = normalizeWord(w);
    const lw = norm.toLowerCase();

    let level: PrefLevel = "OK";

    if (NG.some((x) => lw.includes(x.toLowerCase()))) {
      level = "NG";
    } else if (CAUTION.some((x) => lw.includes(x.toLowerCase()))) {
      level = "CAUTION";
    } else if (OK.some((x) => lw.includes(x.toLowerCase()))) {
      level = "OK";
    }

    tokens.push({ word: w, norm, level });
  }

  const summary = { OK: [] as string[], CAUTION: [] as string[], NG: [] as string[] };
  for (const t of tokens) {
    summary[t.level].push(t.word);
  }

  const flags = {
    hasNG: summary.NG.length > 0,
    hasCaution: summary.CAUTION.length > 0,
  };

  return { tokens, summary, flags };
}

// =========================
// 猫の嗜好を反映した解析
// =========================
export function analyzeWithPrefs(ingredientsText: string, prefs: PrefMap) {
  const base = analyze(ingredientsText);

  const map: PrefMap = {};
  for (const k of Object.keys(prefs)) map[k.toLowerCase()] = prefs[k];

  const tokens = base.tokens.map((t) => {
    const override = map[t.norm.toLowerCase()];
    return override ? { ...t, level: override } : t;
  });

  const summary = { OK: [] as string[], CAUTION: [] as string[], NG: [] as string[] };
  for (const t of tokens) {
    summary[t.level].push(t.word);
  }

  const flags = {
    hasNG: summary.NG.length > 0,
    hasCaution: summary.CAUTION.length > 0,
  };

  return { ...base, tokens, summary, flags };
}

// =========================
// ユーティリティ
// =========================

function splitIngredientsToWords(s: string): string[] {
  return (s || "")
    .split(/[、，,・\n\r\t;／/()（）\[\]【】\s]+/g)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

function normalizeWord(word: string): string {
  return NORMALIZE_MAP[word] || word;
}

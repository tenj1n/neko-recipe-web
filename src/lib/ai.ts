// 手入力の食材名＋gから、おおよその kcal を推定して返す。
// OPENAI_API_KEY があれば OpenAI で推定、無い場合は簡易テーブルでフォールバック。

const FALLBACK_TABLE: Array<{ key: RegExp; kcalPer100g: number }> = [
  { key: /ゆで?ささみ|ささみ|鶏ささみ/i, kcalPer100g: 114 },
  { key: /鶏むね|むね肉/i,             kcalPer100g: 145 },
  { key: /鶏もも|もも肉/i,             kcalPer100g: 200 },
  { key: /まぐろ|マグロ/i,             kcalPer100g: 125 },
  { key: /かつお|カツオ/i,             kcalPer100g: 116 },
  { key: /白身魚|タラ|鱈/i,            kcalPer100g: 80 },
  { key: /サーモン|鮭/i,               kcalPer100g: 208 },
  { key: /さつまいも|サツマイモ/i,     kcalPer100g: 132 },
  { key: /かぼちゃ|南瓜/i,             kcalPer100g: 91 },
  { key: /白米|ご飯|米飯/i,            kcalPer100g: 168 },
  { key: /チーズ/i,                    kcalPer100g: 350 },
];

function fallbackKcal(name: string, grams: number): number | null {
  const hit = FALLBACK_TABLE.find((r) => r.key.test(name));
  if (!hit) return null;
  return Math.round((hit.kcalPer100g * grams) / 100);
}

export async function estimateKcalByName(
  name: string,
  grams: number,
  extra?: { label?: string; ingredientsText?: string }
): Promise<number | null> {
  const n = (name ?? "").trim();
  if (!n || !grams || grams <= 0) return null;

  // まずはフォールバックの簡易テーブル
  const fb = fallbackKcal(n, grams);
  // APIキーが無ければフォールバックを返す
  if (!process.env.OPENAI_API_KEY) return fb;

  try {
    const prompt = [
      "あなたは栄養計算アシスタントです。",
      "以下の食品のカロリーを概算してください。",
      "出力は数値のみ（整数のkcal）で、説明文は書かないでください。",
      "",
      `食品名: ${n}`,
      extra?.label ? `製品ラベル: ${extra.label}` : "",
      extra?.ingredientsText ? `原材料: ${extra.ingredientsText}` : "",
      `分量(g): ${grams}`,
    ].filter(Boolean).join("\n");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!r.ok) return fb;
    const j: any = await r.json();
    const text = (j.choices?.[0]?.message?.content ?? "").toString().trim();
    // 数字だけ抜き出し
    const m = text.match(/-?\d+(\.\d+)?/);
    if (!m) return fb;
    return Math.round(parseFloat(m[0]));
  } catch {
    return fb;
  }
}

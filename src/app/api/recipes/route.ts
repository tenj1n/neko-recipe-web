import { NextRequest, NextResponse } from "next/server";
import { localRecipesFromDiff } from "@/lib/localRecipes";

// ---- 設定（必要なら編集）------------------------------------
const OPENAI_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 10_000;
const MAX_TOKENS = 450;

// エビデンスとして許可するドメイン（必要に応じて追加）
const ALLOWED_REFERENCE_HOSTS = new Set([
  "www.merckvetmanual.com",  // メルク獣医マニュアル
  "merckvetmanual.com",
  "avma.org",                 // 米国獣医師会
  "www.avma.org",
  "wsava.org",                // 世界小動物獣医師会
  "www.wsava.org",
  "fediaf.org",               // 欧州ペットフード工業会
  "www.fediaf.org",
  "aafco.org",                // AAFCO（総論/基準参考）
  "www.aafco.org"
]);

// 既知の危険・不適食（代表例。必要に応じて拡張）
const TOXIC_OR_NG = [
  "玉ねぎ","ねぎ","長ねぎ","にら","ニラ","らっきょう","にんにく","ガーリック",
  "ぶどう","レーズン","チョコ","ココア","アルコール","酒","カフェイン","お茶","コーヒー",
  "キシリトール","マカダミア","生地(酵母)","塩","香辛料","香味野菜(生)","骨","皮",
  "生魚(大量)","青魚(生)","生卵白","牛乳(そのまま)"
];
// -------------------------------------------------------------

type Judgment = Record<"kcal" | "protein" | "fat" | "carbs", "不足" | "過剰" | "適正">;

function buildSystemPrompt() {
  return [
    "あなたは猫の手作り補助レシピの提案アシスタントです。",
    "厳守事項：",
    "1) 出力は必ず JSON オブジェクト { \"recipes\": Recipe[] } のみ。説明文やコードブロックは禁止。",
    "2) Recipe は { title, ingredients, instructions, cautions, references }。",
    "3) ingredients は { name: string, grams: number }[] で、材料名とグラム数（整数, 5–80g目安）を必ず入れる。",
    "4) 調理は必ず加熱（茹でる/蒸す/焼くのいずれか）、味付け・油・骨・皮・ニンニク/ネギ類は禁止。冷まして提供する手順を含める。与える量の目安も一言入れる。",
    "5) ユーザーの「避ける食材」リストと一般的な危険食材を一切含めない。",
    "6) references には 1–3 件の根拠（獣医/業界ガイドライン等）のURLを含める（title と url）。",
    "7) 参考URLは、可能なら Merck Vet Manual / AVMA / WSAVA / FEDIAF / AAFCO など信頼できる一次・準一次資料を優先。",
    "8) 目的は不足栄養の補完・過多の抑制。補助食であり総合栄養食を置き換えないことを前提とする。",
    "9) 日本語で簡潔に書く。title は20字以内。",
  ].join("\n");
}

function buildUserPrompt(args: { diff: any; judgment: Judgment; allergies?: string[] }) {
  const { diff, judgment, allergies = [] } = args;
  return [
    `不足/過多の判定: ${JSON.stringify(judgment)}`,
    `目標に対する差分(概算): ${JSON.stringify(diff)}`,
    allergies.length ? `避ける食材(ユーザー指定): ${allergies.join(", ")}` : "避ける食材(ユーザー指定): なし",
    `危険・不適食の例: ${TOXIC_OR_NG.join("、")}`,
    "条件に合わせて 3 件の Recipe を作成してください。",
  ].join("\n");
}

// コードフェンス除去（保険）
function stripCodeFences(s: string) {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

// レシピのサニタイズと採用判定
function filterAndNormalize(recipes: any[], allergies: string[]) {
  const lowerAll = new Set(allergies.map(a => a.toLowerCase()));
  const lowerNG = TOXIC_OR_NG.map(x => x.toLowerCase());

  const okHost = (url: string) => {
    try {
      const h = new URL(url).host.replace(/^www\./, "");
      return ALLOWED_REFERENCE_HOSTS.has(h) || ALLOWED_REFERENCE_HOSTS.has(`www.${h}`);
    } catch { return false; }
  };

  const safe = (r: any) => {
    const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
    const names: string[] = ings.map((i: any) => String(i?.name ?? ""));

    // アレルギー/危険食材チェック
    const hasAllergy = names.some(n => lowerAll.has(n.toLowerCase()));
    const hasNG = names.some(n => lowerNG.some(ng => n.toLowerCase().includes(ng)));
    if (hasAllergy || hasNG) return false;

    // 分量・手順の最低限チェック
    const gramsOK = ings.every((i: any) => Number.isFinite(i?.grams) && i.grams > 0);
    const instrOK = typeof r.instructions === "string" && /茹|蒸|焼|煮/.test(r.instructions) && /冷ま/.test(r.instructions);
    if (!gramsOK || !instrOK) return false;

    // 参考URLのホワイトリスト
    const refs = Array.isArray(r.references) ? r.references : [];
    const hasAllowedRef = refs.some((ref: any) => typeof ref?.url === "string" && okHost(ref.url));
    if (!hasAllowedRef) return false;

    return true;
  };

  // UI互換：ingredients を "材料名 30g" の string[] に整形
  const toDisplay = (r: any) => ({
    title: String(r.title ?? ""),
    ingredients: (Array.isArray(r.ingredients) ? r.ingredients : [])
      .map((i: any) => `${i?.name ?? ""} ${Math.round(i?.grams ?? 0)}g`),
    instructions: String(r.instructions ?? ""),
    cautions: r.cautions ?? [],
    references: r.references ?? []
  });

  const filtered = (recipes ?? []).filter(safe);
  return {
    raw: filtered,
    display: filtered.map(toDisplay)
  };
}

// --- 軽いキャッシュ（同一条件5分） ---
const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 5 * 60 * 1000;
const keyOf = (body: any) => JSON.stringify(body);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { diff, judgment, allergies = [] } = body ?? {};

    const useLocal = process.env.USE_LOCAL_RECIPES === "1" || !process.env.OPENAI_API_KEY;
    if (useLocal) {
      const recipes = localRecipesFromDiff({ diff, judgment, allergies });
      return NextResponse.json({ recipes, note: "local" });
    }

    // キャッシュ
    const key = keyOf(body);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return NextResponse.json(
        { recipes: hit.data.display, raw: hit.data.raw, note: "openai(cache)" },
        { headers: { "x-recipes-source": "openai(cache)" } }
      );
    }

    // OpenAI 呼び出し（JSONモード＋タイムアウト）
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" }, // JSON固定
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt({ diff, judgment, allergies }) },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await res.json();

    // 失敗時はフォールバック
    if (!res.ok) {
      const code = data?.error?.code || data?.error?.type || "";
      if (code === "insufficient_quota" || code === "billing_not_active" || code === "rate_limit_exceeded" || code === "request_timeout") {
        const recipes = localRecipesFromDiff({ diff, judgment, allergies });
        return NextResponse.json({ recipes, note: `fallback(local): ${code}` });
      }
      return NextResponse.json({ error: data }, { status: 500 });
    }

    // 解析
    const text: string = data?.choices?.[0]?.message?.content ?? "{}";
    const cleaned = stripCodeFences(text);
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const recipes = localRecipesFromDiff({ diff, judgment, allergies });
      return NextResponse.json({ recipes, note: "fallback(local): parse_error" });
    }

    // { recipes: [...] } or 直接配列 の両対応
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.recipes) ? parsed.recipes : [];
    const normalized = filterAndNormalize(arr, allergies);

    // 0件なら安全側に倒す
    if (normalized.display.length === 0) {
      const recipes = localRecipesFromDiff({ diff, judgment, allergies });
      return NextResponse.json({ recipes, note: "fallback(local): filtered_all" });
    }

    cache.set(key, { at: Date.now(), data: normalized });

    return NextResponse.json(
      { recipes: normalized.display, raw: normalized.raw, note: "openai" },
      { headers: { "x-recipes-source": "openai" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}

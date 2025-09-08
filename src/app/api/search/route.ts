// /src/app/api/search/route.ts
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic"; // 毎回検索

// 全角/半角・空白・小文字化のゆるい正規化
const normalize = (s: string) =>
  s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

// GET/POST どちらでも q/keyword/query/term/text を受け取る
async function extractQuery(req: Request) {
  const url = new URL(req.url);
  const fromGet =
    url.searchParams.get("q") ??
    url.searchParams.get("keyword") ??
    url.searchParams.get("query") ??
    url.searchParams.get("term") ??
    url.searchParams.get("text");
  if (fromGet) return fromGet;

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      const body = await req.json();
      return body?.q ?? body?.keyword ?? body?.query ?? body?.term ?? body?.text ?? "";
    } catch {
      return "";
    }
  }
  return "";
}

// Prisma where 用：SQLite は mode: "insensitive" 非対応なので付けない
const orFor = (t: string) => [
  { name: { contains: t } },
  { brand: { contains: t } },
  { ingredients_text: { contains: t } },
  { variants: { some: { label: { contains: t } } } },
  { variants: { some: { flavor: { contains: t } } } },
  { variants: { some: { features: { contains: t } } } },
  { variants: { some: { ingredients_text: { contains: t } } } },
];

async function doSearch(input: string) {
  const kw = normalize(input);
  if (!kw) return [];
  const terms = kw.split(" ").filter(Boolean);
  const and = terms.length ? terms.map((t) => ({ OR: orFor(t) })) : [{ OR: orFor(kw) }];

  const rows = await prisma.product.findMany({
    where: { AND: and },
    include: { variants: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 30,
  });

  // バリアント有りを上に
  rows.sort((a, b) => b.variants.length - a.variants.length);
  return rows;
}

const json = (d: unknown, init?: number | ResponseInit) =>
  new Response(JSON.stringify(d), {
    ...(typeof init === "number" ? { status: init } : init),
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function GET(req: Request) {
  try {
    const q = await extractQuery(req);
    return json(await doSearch(q));
  } catch (e) {
    console.error("GET /api/search error", e);
    return json({ error: "internal_error" }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const q = await extractQuery(req);
    return json(await doSearch(q));
  } catch (e) {
    console.error("POST /api/search error", e);
    return json({ error: "internal_error" }, 500);
  }
}

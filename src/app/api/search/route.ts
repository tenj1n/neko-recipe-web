import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 検索API: まず自前DB、足りなければ外部APIも併用
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ q, count: 0, items: [] });

  // 1) 先にローカルDBを検索（部分一致・大文字小文字区別なし）
  const local = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { brand: { contains: q } },
      ],
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  const localItems = local.map((p) => ({
    source: "local" as const,
    barcode: p.barcode,
    brand: p.brand ?? "",
    name: p.name ?? "",
    image: p.image ?? "",
    ingredients_text: p.ingredients_text ?? "",
  }));

  // 2) 外部API（OpenFoodFacts）も並行で取得（日本語は薄いのでオマケ扱い）
  //    外部が遅くてもUIが固まらないようにタイムアウト短め
  let externalItems: any[] = [];
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000); // 4秒で諦める
    const r = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        q
      )}&search_simple=1&action=process&json=1&page_size=10`,
      { signal: controller.signal, cache: "no-store" }
    );
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json();
      externalItems =
        (j.products ?? []).map((it: any) => ({
          source: "off" as const,
          barcode: String(it.code ?? ""),
          brand: String(it.brands ?? "").split(",")[0]?.trim() ?? "",
          name: String(it.product_name ?? it.generic_name ?? "").trim(),
          image:
            it.image_front_small_url ||
            it.image_small_url ||
            it.image_url ||
            "",
          ingredients_text:
            it.ingredients_text_jp ||
            it.ingredients_text ||
            "",
        })) ?? [];
    }
  } catch {
    // 外部失敗は無視（ローカル結果だけ返す）
  }

  // 3) ローカル優先で結合（同一バーコードは重複排除）
  const seen = new Set<string>();
  const items = [...localItems, ...externalItems].filter((x) => {
    const key = x.barcode || `${x.source}:${x.name}:${x.brand}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ q, count: items.length, items });
}

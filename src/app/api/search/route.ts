// src/app/api/search/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

type SearchBody = { q?: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SearchBody;
    const q = body?.q ?? "";
    const query: string = String(q).trim();

    if (!query) return Response.json([], { status: 200 });

    // 全角スペースも区切り対象に（最大5語まで）
    const tokens: string[] = query
      .split(/[\s\u3000]+/)
      .map((t: string) => t.trim())
      .filter((s: string) => s.length > 0)
      .slice(0, 5);

    // 1語ぶんの OR 条件（※ SQLite なので mode は使わない）
    const orForToken = (t: string) => ({
      OR: [
        { name: { contains: t } },
        { brand: { contains: t } },
        { ingredients_text: { contains: t } },
        {
          variants: {
            some: {
              OR: [
                { label: { contains: t } },
                { flavor: { contains: t } },
                { features: { contains: t } },
                { ingredients_text: { contains: t } },
              ],
            },
          },
        },
      ],
    });

    // 全語 AND
    const where =
      tokens.length <= 1
        ? orForToken(tokens[0] ?? query)
        : { AND: tokens.map((t: string) => orForToken(t)) };

    const products = await prisma.product.findMany({
      where,
      include: { variants: true },
      take: 50,
      orderBy: [{ name: "asc" }],
    });

    return Response.json(products, { status: 200 });
  } catch (e: any) {
    return Response.json(
      { error: true, message: e?.message ?? "search failed" },
      { status: 500 }
    );
  }
}

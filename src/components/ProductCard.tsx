"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Variant = {
  id: number;
  label?: string;
  flavor?: string;
  form?: string;
  kcalPer100g?: number | null;
};

type Props = {
  product: {
    id: number;
    name: string;
    brand?: string;
    barcode?: string;
    variants: Variant[];
  };
};

export default function ProductCard({ product }: Props) {
  const sp = useSearchParams();
  const selectMode = sp.get("select") === "variant";
  // 安全のため内部パスのみ許可
  const retRaw = sp.get("return") || "/meals/new";
  const returnPath = retRaw.startsWith("/") ? retRaw : "/meals/new";
  const row = sp.get("row") ?? undefined;
  const grams = sp.get("grams") ?? undefined;
  const catId = sp.get("catId") ?? undefined;
  const date = sp.get("date") ?? undefined;
  const slot = sp.get("slot") ?? undefined;

  function buildReturnUrl(variantId: number) {
    const baseHasQuery = returnPath.includes("?");
    const p = new URLSearchParams();
    p.set("variantId", String(variantId));
    if (row) p.set("row", row);
    if (grams) p.set("grams", grams);
    if (catId) p.set("catId", catId);
    if (date) p.set("date", date);
    if (slot) p.set("slot", slot);
    return `${returnPath}${baseHasQuery ? "&" : "?"}${p.toString()}`;
  }

  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="font-semibold">{product.name}</div>
      <div className="text-xs opacity-70">
        {product.brand ? `ブランド: ${product.brand}` : ""}
        {product.barcode ? `　| バーコード: ${product.barcode}` : ""}
      </div>

      <ul className="space-y-1">
        {product.variants.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between gap-2 rounded-md border px-2 py-1"
          >
            <div className="text-sm">
              {v.label || "無印"}
              {v.flavor ? ` / ${v.flavor}` : ""}
              {v.form ? ` / ${v.form}` : ""}
              {Number.isFinite(v.kcalPer100g as number) ? `（${v.kcalPer100g} kcal/100g）` : ""}
            </div>

            {selectMode ? (
              <Link
                href={buildReturnUrl(v.id)}
                className="text-xs rounded-md border px-2 py-1 hover:bg-white/10"
                title="このバリアントを選んで /meals/new に戻る"
              >
                選択して戻る
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

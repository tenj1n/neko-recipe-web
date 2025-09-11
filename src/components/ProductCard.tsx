// src/components/ProductCard.tsx
"use client";
import React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { Cat, Activity, Product as P, ProductVariant as V } from "@prisma/client";
import { useActiveCat } from "@/lib/useActiveCat";
// ...既存 import

export default function ProductCard({ product }: { product: P & { variants: V[] } }) {
  const { catId, setCatId } = useActiveCat(); // ★ setCatId も使う
  const [cat, setCat] = React.useState<Cat | null>(null);

  React.useEffect(() => {
    let abort = false;
    (async () => {
      if (!catId) { setCat(null); return; }
      const r = await fetch(`/api/cat/${catId}`, { cache: "no-store" }).catch(() => null);
      if (!r || !r.ok) {
        if (r && r.status === 404) {
          // 迷子のIDを自動クリア（猫ピッカーが未選択に戻る）
          setCatId(null);
        }
        if (!abort) setCat(null);
        return;
      }
      const c: Cat = await r.json();
      if (!abort) setCat(c ?? null);
    })();
    return () => { abort = true; };
  }, [catId, setCatId]);

  // ...（中略）...

  return (
    <div className="rounded-2xl shadow p-4 bg-white space-y-4">
      <div className="flex gap-4">
        <div className="w-28 h-28 relative shrink-0 rounded overflow-hidden bg-gray-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              // これで Console の "fill なのに sizes がない" 警告を解消
              sizes="(max-width: 640px) 96px, 112px"
              // LCP 対策：最初のカードなら priority を true にしてOK（任意）
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-gray-400">No Image</div>
          )}
        </div>
        {/* ...既存のヘッダー */}
      </div>

      {/* ...既存の内容（給与目安ボックスの条件は cat && v?.kcalPer100g != null のままでOK） */}
    </div>
  );
}

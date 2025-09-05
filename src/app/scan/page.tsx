"use client";
import React, { useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductCard from "@/components/ProductCard";
import { useActiveCat } from "@/lib/useActiveCat";

type Product = any;

export default function ScanPage() {
  const { catId } = useActiveCat();
  const [product, setProduct] = useState<Product | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">バーコード読取</h1>
        <a href="/search" className="text-sm underline">
          商品名検索へ
        </a>
      </div>

      <BarcodeScanner
        onDetected={async (c) => {
          setLoading(true);
          setCode(c);
          const r = await fetch(`/api/products/${c}`, { cache: "no-store" });
          const j = await r.json();
          setProduct(j);
          setLoading(false);
        }}
      />
      {code && <div className="text-xs text-gray-500 mt-1">読取りコード: {code}</div>}
      {loading && <p className="mt-3">検索中…</p>}

      {product && !product.error && <ProductCard product={product} catId={catId} />}

      {product?.error && (
        <div className="mt-4 border p-3 rounded bg-red-50">
          <p className="text-red-600 font-medium">
            外部データベースに未登録の商品です（バーコード: {product.barcode}）。
          </p>
          <p className="text-sm text-gray-600 mb-2">
            手動で登録してください。次回からはこのDBから即ヒットします。
          </p>
        </div>
      )}
    </div>
  );
}

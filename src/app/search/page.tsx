"use client";
import ProductSearch from "@/components/ProductSearch";

export default function SearchPage() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">商品名検索</h1>
        <a href="/scan" className="text-sm underline">
          バーコード読取へ
        </a>
      </div>
      <ProductSearch />
    </div>
  );
}

// src/app/search/page.tsx
import ProductSearch from "@/components/ProductSearch";

export default function SearchPage() {
  return (
    <main className="px-4 py-8">
      <h1 className="text-center text-lg font-semibold mb-4">商品名検索</h1>
      <ProductSearch />
    </main>
  );
}

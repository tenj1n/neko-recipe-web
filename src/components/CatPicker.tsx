"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveCat } from "@/app/cat/actions";

type CatOption = { id: string; name: string };

export default function CatPicker({
  cats,
  activeCatId,
}: {
  cats: CatOption[];
  activeCatId?: string | null;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <select
      className="px-2 py-1 rounded border bg-black text-white"
      value={activeCatId ?? ""}
      onChange={(e) =>
        start(async () => {
          await setActiveCat(e.target.value);
          router.refresh(); // サーバーコンポーネントを再描画（Cookie反映）
        })
      }
      disabled={pending}
    >
      <option value="" disabled>猫を選択</option>
      {cats.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

// src/app/cat/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import CatForm from "@/app/cat/_components/CatForm";
import type { z } from "zod";
import { catCreateSchema } from "@/lib/catSchema";

type CreateInput = z.infer<typeof catCreateSchema>;

export default function CatNewPage() {
  const router = useRouter();

  return (
    <CatForm
      title="新規猫プロフィール"
      submitLabel="登録"
      // ← 初期値はすべて「未選択」になるように空で渡す
      initial={{}}
      onCancel={() => router.push("/cat")}
      onSubmit={async (data: CreateInput) => {
        // data は catCreateSchema 準拠
        const res = await fetch("/api/cat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          let err = `登録に失敗しました (${res.status})`;
          try {
            const j = await res.json();
            if (j?.error) err = j.error;
          } catch {}
          throw new Error(err);
        }
        router.push("/cat");
      }}
    />
  );
}

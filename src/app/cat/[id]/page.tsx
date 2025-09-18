// src/app/cat/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CatEditor, { CatForEdit } from "@/components/cat/CatEditor";

export const dynamic = "force-dynamic";

export default async function CatDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  const cat = await prisma.cat.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      weightKg: true,
      ageYears: true,
      activity: true,
      sex: true,
      hairAmount: true,
      size: true,
      neutered: true,
      allergies: true,
    },
  });

  if (!cat) return notFound();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">猫の情報（編集）</h1>
        <a href="/cat" className="px-3 py-1.5 rounded border">一覧へ</a>
      </div>

      <CatEditor initialCat={cat as CatForEdit} />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import CatPicker from "@/components/CatPicker";

export default async function Header() {
  const ck = await cookies();
  const activeCatId = ck.get("activeCatId")?.value ?? "";

  // TODO: ログインユーザーIDに合わせる（ここでは簡易的に全件）
  const cats = await prisma.cat.findMany({ select: { id: true, name: true } });

  return (
    <header className="flex items-center justify-between p-3 border-b">
      <div className="font-semibold">neko-recipe</div>
      <CatPicker cats={cats} activeCatId={activeCatId} />
    </header>
  );
}

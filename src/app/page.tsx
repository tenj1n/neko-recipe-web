// src/app/page.tsx
import { getServerSession } from "next-auth";
import HomeClient from "@/components/home/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();
  return <HomeClient sessionEmail={session?.user?.email ?? null} />;
}

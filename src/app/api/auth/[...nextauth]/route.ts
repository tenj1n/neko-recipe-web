// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma =
  (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email) return null;

        // 既存ユーザーを検索
        const existing = await prisma.user.findUnique({ where: { email } });

        // 無ければ自動作成（初回ログイン）
        if (!existing) {
          const hashed =
            await bcrypt.hash(password || (email + (process.env.NEXTAUTH_SECRET ?? "")), 10);
          const created = await prisma.user.create({
            data: { email, password: hashed },
          });
          return { id: created.id, email: created.email };
        }

        // 既存ユーザー：パスワードが両方ある場合のみ検証（開発運用）
        if (existing.password && password) {
          const ok = await bcrypt.compare(password, existing.password);
          if (!ok) return null; // 認証失敗
        }

        return { id: existing.id, email: existing.email };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) (session.user as any).id = token.sub; // API側で userId を使えるように
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// API から getServerSession(auth) で使うために export
export const auth = authOptions;

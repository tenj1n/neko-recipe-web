// NextAuth 本体をインポート
import NextAuth from "next-auth";
// 「メール＋パスワード」認証用のプロバイダをインポート
import Credentials from "next-auth/providers/credentials";
// PrismaClient（DB操作用）
import { PrismaClient } from "@prisma/client";
// パスワードを暗号化・照合するライブラリ
import bcrypt from "bcryptjs";

// PrismaClient をシングルトンで使い回す（開発中のホットリロード対策）
// → globalThis に保存して、二重に new されないようにしている
const prisma =
  (globalThis as any).__prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

// NextAuth の設定
const auth = NextAuth({
  // セッションの保持方式を「JWT」にする
  session: { strategy: "jwt" },

  // 利用する認証プロバイダ
  providers: [
    Credentials({
      name: "credentials", // プロバイダ名（任意）
      credentials: {
        // フロント側のログインフォームに表示される入力フィールド定義
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      // 認証処理の本体
      async authorize(credentials) {
        // 入力されたメールとパスワードを受け取る
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null; // 空なら失敗

        // DBからユーザーを検索
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null; // 見つからなければ失敗

        // 入力パスワードとDBのハッシュを照合
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null; // 不一致なら失敗

        // 認証成功したらユーザー情報を返す
        // → これがセッション情報に含まれる
        return { id: user.id, email: user.email };
      },
    }),
  ],
});

// Next.js の App Router では
// GET/POST 両方を export する必要がある
export { auth as GET, auth as POST };

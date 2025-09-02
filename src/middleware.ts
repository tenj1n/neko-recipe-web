// NextAuth の既成ミドルウェアをそのまま使う
export { default } from "next-auth/middleware";

// ここに書いた“以外”はすべて認証必須
export const config = {
  matcher: [
    // ログイン不要のパスを除外
    "/((?!login|register|api/auth|_next|favicon.ico).*)",
  ],
};

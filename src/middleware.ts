// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// /api/auth と静的リソースは除外
export const config = {
  matcher: [
    // これ以外のパスにだけミドルウェアを適用
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico)).*)',
  ],
};

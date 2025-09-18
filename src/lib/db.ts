// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

// ホットリロード時に複数インスタンスを作らないためのガード
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// named と default の両方をエクスポート（import 側のゆらぎに強い）
export default prisma;

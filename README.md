This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
🐱 neko-recipe-web

猫のための食材チェック & レシピ支援サービス（Web版）

バーコード読取 / 商品検索でキャットフードや食材を登録

猫ごとのプロフィール・嗜好を反映して成分解析

OK/NG食材リストに基づいてフィードバック

🚀 セットアップ手順
# 依存パッケージのインストール
npm install

# DBマイグレーション
npx prisma migrate dev

# 初期データ投入（主要フードや食材ルール）
npx prisma db seed

# 開発サーバ起動
npm run dev


→ http://localhost:3000
 にアクセス

📂 フォルダ構成（概要）
neko-recipe-web/
├─ .env                  # DB接続 (例: DATABASE_URL="file:./prisma/dev.db")
├─ prisma/               # Prisma スキーマ & マイグレーション
│  ├─ schema.prisma
│  ├─ dev.db
│  └─ seed.ts
├─ public/               # 静的ファイル (favicon 等)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx      # ルートレイアウト（右上に猫切替）
│  │  ├─ page.tsx        # トップページ
│  │  ├─ scan/page.tsx   # バーコード読取画面
│  │  ├─ search/page.tsx # 商品名検索画面
│  │  └─ api/            # APIルート群
│  ├─ components/        # UIコンポーネント
│  │  ├─ BarcodeScanner.tsx
│  │  ├─ ProductCard.tsx
│  │  ├─ ProductSearch.tsx
│  │  ├─ TagDialog.tsx
│  │  ├─ CatPicker.tsx
│  │  └─ Header.tsx
│  └─ lib/               # 共通ロジック
│     ├─ db.ts
│     ├─ useActiveCat.ts
│     ├─ ingredientRules.ts
│     ├─ analyzeIngredients.ts
│     └─ catSchema.ts
└─ README.md

🖥 主要機能
🔍 バーコード読取

/scan

カメラで1回スキャン → 自動停止

「カメラ起動」ボタンで再読取可能

📝 商品名検索

/search

名前で検索 → 一覧表示 → 商品選択

「タグ設定」で一括保存

📦 商品カード (ProductCard.tsx)

JANコード、ブランド、画像、原材料チップ表示

成分に OK / 注意 / NG タグ付け可能

🐈 猫プロフィール・嗜好保存

API /api/cats/[id]/prefs（単体GET/PUT）

API /api/cats/[id]/prefs/bulk（まとめ保存）

CatPicker で猫を切り替え

📊 栄養・安全ルール

主食は必ず 総合栄養食

人間食材は 総カロリーの10％以内

【OK食材】鶏ささみ、白身魚、かぼちゃ、ブルーベリーなど（加熱・無味・少量）

【NG食材】ネギ類、アボカド、ブドウ、チョコ、カフェイン、アルコール
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

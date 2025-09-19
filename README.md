This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
neko-recipe

猫のごはん／うんち／体調を“日めくり”で記録するアプリ
Next.js（App Router）+ Prisma + Tailwind ベース。
カレンダー・栄養サマリ・猫プロフィール（画像対応）・商品検索（任意）を搭載。
可愛い UI（ピル型ボタン／肉球アニメ）を同梱。

目次

機能一覧

技術スタック

ディレクトリ構成

クイックスタート（最短3分）

詳細セットアップ

5.1 前提条件

5.2 インストール

5.3 環境変数

5.4 DB 準備（Prisma / SQLite）

5.5 開発サーバ

認証（NextAuth）

UI とデザイン指針

データモデル（Prisma）

API エンドポイント

画像アップロード（猫のアバター）

AI（任意：栄養コメント/レシピ提案）

デプロイ（外部の人が立てられる？→立てられます）

Docker 実行（任意）

トラブルシューティング

開発コマンドまとめ

貢献ガイド

ライセンス

機能一覧

🗓️ カレンダー：日別の食事・うんちログを一覧。

✍️ DayEditor（モーダル）：

うんちログ（性状/色/量/粘液/血/メモ）

食事入力（朝/昼/夕/間食、メモ、アイテム名・g・kcal）

栄養サマリ（摂取kcal/目標kcal/差分、AI解説/レシピ※任意）

🐈 猫プロフィール：一覧／新規／編集。画像アップロード対応。

🔎 商品検索（任意）：食材/おやつを検索して利用。

💅 可愛い UI：ピル型ボタン・肉球アニメ・コントラスト補正・“Cream”固定の明るい背景。

🔐 認証：NextAuth によるメール/パスワード。

🗃️ DB：Prisma + SQLite（開発）/ Postgres（本番推奨）。

技術スタック

Next.js 15（App Router） / TypeScript

Tailwind CSS + 追加ユーティリティ（globals.css に多数）

Prisma + SQLite（デフォルト）

NextAuth（メール＋パスワード）

OpenAI（任意：AI コメント／レシピ提案）

ディレクトリ構成
src/
  app/
    api/
      auth/[...nextauth]/route.ts     # 認証
      calendar/                        # 月次の記録サマリ
      cat/                             # 猫プロフィール（一覧/作成/取得/更新/削除）
        [id]/avatar/route.ts           # 猫のアバター画像アップロード（FormData: file）
      meals/                           # 食事ログ保存
      stool/                           # うんちログ保存
      nutrition/
        summary/route.ts               # 栄養サマリ（AIコメント対応）
      upload/                          # 任意：共通アップロード（使わないなら不要）
    calendar/                          # カレンダー画面
    cat/                               # 猫：一覧 / 新規 / 編集
    search/                            # 商品検索（任意）
  components/
    calendar/                          # CalendarMain / DayEditor
    cat/                               # CatEditor
  hooks/                               # 例：useActiveCat
  lib/
    prisma.ts                          # Prisma クライアント
  styles/（あれば）
app/globals.css                        # かわいい UI のユーティリティを同梱
prisma/
  schema.prisma                        # Prisma スキーマ

クイックスタート（最短3分）
# 1) 依存関係
npm i

# 2) .env.local を作成（下のテンプレ）
# 3) DB マイグレーション
npx prisma migrate dev --name init

# 4) 起動
npm run dev
# → http://localhost:3000
# 5) /register でユーザー作成 → /cat で猫を作る → /calendar で記録！


.env.local（最小）

DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-何でもOK"

# AIを使うなら（任意）
# OPENAI_API_KEY="sk-..."

詳細セットアップ
前提条件

Node.js 18+（推奨 20+）

npm（または pnpm / bun）

SQLite（開発時は自動生成。GUI は npx prisma studio が便利）

インストール
npm i

環境変数
変数	必須	説明
DATABASE_URL	✅	開発は file:./prisma/dev.db（SQLite）、本番は Postgres など
NEXTAUTH_URL	✅	例：http://localhost:3000、本番は実ドメイン
NEXTAUTH_SECRET	✅	ランダム文字列
OPENAI_API_KEY	任意	AIコメント/レシピ有効化時に使用
DB 準備（Prisma / SQLite）
npx prisma migrate dev --name init
# Prisma Studio
npx prisma studio

開発サーバ
npm run dev
# http://localhost:3000

認証（NextAuth）

/register からメール＋パスワードでユーザー作成

/login でログイン

セッションは Cookie で管理。NEXTAUTH_URL と NEXTAUTH_SECRET は必須

ブラウザのサードパーティ Cookie を強く制限しているとログインに失敗する場合があります。まずは素の Chrome で確認してください。

UI とデザイン指針

背景は常に“クリーム色”で固定（OS のダーク設定に影響されない）。globals.css に以下のユーティリティがあります。

ピル型：.nav-pill（ヘッダ） / .btn-cute / .btn-primary-cute

フォーカスリング：.focus-ring（キーボード操作見える化）

入力：.input-cute（背景白・枠ピンク）

可愛い演出：.paw-hover（肉球がポン）、.card-ears（猫耳）、.decor-paws（背景の肉球）

文字のコントラスト補正：見出しや “薄文字” ユーティリティの上書きを同梱

既存の bg-zinc-* / text-zinc-* / hover:bg-* など黒系クラスが残っていると、背景が黒くなったり文字が薄くなります。上のクラスだけで統一してください。

データモデル（Prisma）

主なモデル：

User — Cat (1:N)

Cat … meals (Meal[]), stoolLogs (StoolLog[]) を所有
任意：画像 URL を永続化するなら avatarUrl String? を追加してください

Meal（date + slot がユニーク）
MealItem[]（名称/grams/kcal/製品参照）

StoolLog（date ユニーク。1日複数回にしたいならユニーク解除）

Prisma 変更後は npx prisma migrate dev --name XXX を実行。

API エンドポイント
Method	Path	役割
GET	/api/cat	猫の簡易一覧（id, name）
POST	/api/cat	新規作成
GET/PUT/DELETE	/api/cat/[id]	取得/更新/削除
PUT	/api/cat/[id]/avatar	画像アップロード（FormData: file）
GET	/api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD	期間のサマリ
PUT	/api/meals	1日の特定スロットの食事保存
PUT	/api/stool	1日のうんちログ保存
GET	/api/nutrition/summary?date=YYYY-MM-DD	栄養サマリ（AIコメント対応）

DayEditor の栄養タブで表示される 「現在、〇〇さんは◯◯kcal 不足です」 は /api/nutrition/summary のレスポンス explanation を表示しています。レシピ案を出したい場合はこの API で生成してください。

画像アップロード（猫のアバター）

画面：/cat/[id]（編集）・/cat/new（新規）で画像選択 → 保存

API：PUT /api/cat/[id]/avatar に FormData で file を送る

保存先：簡易実装では ローカルディスク（public/uploads） に置くのが手軽

マルチインスタンスや CDN を使う場合は S3 等に置き、DB 側には avatarUrl を保存

「保存後に画像が消える」の典型原因は DB に URL を保存していない／GET で返していないです。
schema.prisma に avatarUrl String? を追加 → /api/cat/[id] の応答に含める → フロントの初期値に反映、の流れを確認してください。

AI（任意：栄養コメント／レシピ提案）

OPENAI_API_KEY が 未設定なら AI 呼び出しはスキップされ、プレーンな説明のみ表示されます。
使う場合：

OPENAI_API_KEY を .env.local に設定

src/app/api/nutrition/summary/route.ts 内でプロンプトを整備（不足カロリーに合わせた具体的レシピ案を返す）

explanation に文章を組み立てて返却

依存関係注意（zod 競合）
openai@5.x は zod@3 を前提にします。すでに zod@4 を使っている場合は 2 つの選択肢：

AI を使わない（推奨：何も追加しない）

使うなら互換バージョンで固定：

npm i -E openai@4.68.4 zod@3.23.8

Docker 実行（任意）
例：Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]

例：docker-compose.yml（ローカル Postgres）
version: "3"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: neko
    ports: ["5432:5432"]
    volumes: [dbdata:/var/lib/postgresql/data]
  web:
    build: .
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/neko
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: dev-secret
    ports: ["3000:3000"]
    depends_on: [db]
volumes:
  dbdata:

トラブルシューティング
1) NextAuth CLIENT_FETCH_ERROR / Failed to fetch

NEXTAUTH_URL 未設定 or 実URLと不一致

Dev サーバ未起動、または /api/auth/* へ到達不能

ブラウザの厳しめなトラッキング保護 → 素の Chrome で試す

2) 画像が保存されない／再表示されない

avatarUrl を DB に保存していない or API GET が返していない

フロントの初期値（CatEditor）に avatarUrl を渡していない

デプロイ先（Vercel 等）でローカル書き込み不可 → S3 を使う

3) 栄養タブが「不足kcal」しか出ない

OPENAI_API_KEY 未設定 → AI なしのプレーン説明のみ

/api/nutrition/summary の explanation 生成ロジックを拡張して 具体レシピ案を文字列に含める

4) npm i openai が zod で壊れる

openai@5.x は zod@3 が前提。zod@4 と競合

対策：npm i -E openai@4.68.4 zod@3.23.8 か、AIを使わない

5) カレンダーのボタンが黒くなる／文字が薄い

既存 bg-* / text-* が残っている → .btn-cute / .nav-pill のみに統一

globals.css のコントラスト補正が効くよう、text-muted-foreground 等は避ける

6) Prisma の database is locked（SQLite）

ホットリロード時に稀に発生 → サーバ再起動

本番運用では Postgres を推奨

開発コマンドまとめ
# 開発起動
npm run dev

# 本番ビルド & 起動
npm run build
npm run start

# Prisma
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma studio
npx prisma generate

# Lint
npm run lint

貢献ガイド

Issue を立てて方針を共有

フォーク → ブランチ切って修正

npm run lint に通す

主要画面のスクショと動作メモを添えて PR

UI の一貫性（ピル型／フォーカスリング／44px 以上のタップ領域）にご協力ください 🐾

ライセンス

プロジェクト内利用を前提。外部公開する場合は MIT ライセンス等に変更しても OK。

外部パッケージのライセンスは各作者に帰属。
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

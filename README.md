This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
# neko-recipe

> 🐱 猫の食事・うんち・体調を記録し、かわいい UI で日々を振り返れる Next.js アプリ。

---

## 目次
- [特徴](#特徴)
- [スクリーンショット](#スクリーンショット)
- [動作環境](#動作環境)
- [クイックスタート](#クイックスタート)
- [環境変数](#環境変数)
- [データベース (Prisma + SQLite)](#データベース-prisma--sqlite)
- [開発スクリプト](#開発スクリプト)
- [ディレクトリ構成](#ディレクトリ構成)
- [ページ一覧](#ページ一覧)
- [かわいい UI の使い方](#かわいい-ui-の使い方)
- [AI 栄養コメント (任意)](#ai-栄養コメント-任意)
- [よくあるエラーと対処](#よくあるエラーと対処)
- [デプロイ](#デプロイ)
- [ライセンス](#ライセンス)

---

## 特徴
- 📅 **カレンダーで一括管理**: 日毎の食事・うんちログをワンクリックで編集。
- 🧮 **栄養サマリ**: 摂取 kcal / 目標 kcal / 差分を即時表示。任意で AI コメントも付与。
- 🐾 **かわいい UI**: ピル型ボタン、肉球ホバー、猫耳カードなどのユーティリティを同梱。
- 🔎 **商品検索 / バーコード**: フード登録を手早く。
- 😺 **複数猫対応**: 右上の猫スイッチャーで素早く切り替え。
- 🔐 **NextAuth**: メール+パスワードの簡易ログイン (実装/設定済)。

---

## スクリーンショット
- ホーム: カード + クイックアクション
- カレンダー: 日毎のサマリとモーダル編集
- 猫の情報: 一覧/編集 (アバターアップロード対応)

> 画像はリポジトリの `docs/` か Issue を参照 (掲載省略)。

---

## 動作環境
- Node.js **18 以上** (推奨 20)
- npm / pnpm / yarn のいずれか
- データベース: 既定は **SQLite** (ファイル: `prisma/dev.db`)

---

## クイックスタート
```bash
# 1) 依存関係を取得
npm i

# 2) DB を作成 & マイグレーション
npx prisma migrate dev

# 3) (任意) サンプルデータ投入
npx prisma db seed  # 例: ユーザーやサンプル猫

# 4) 開発サーバー起動
npm run dev
# http://localhost:3000 にアクセス
```
> ログイン方法: シードしたユーザーでログイン。詳しくは `prisma/seed.*` を参照。

---

## 環境変数
ルートに `.env` を作成して設定します。
```bash
# DB (SQLite はこのままでOK)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth (実運用時はランダム値を設定)
NEXTAUTH_SECRET="your-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# (任意) OpenAI を使う場合のみ
# OPENAI_API_KEY="sk-..."
```
> 実運用では `NEXTAUTH_SECRET` を必ず安全な乱数にしてください。

---

## データベース (Prisma + SQLite)
- スキーマ: `prisma/schema.prisma`
- 主要モデル:
  - `User` / `Cat` (猫の基本情報、アバター URL optional)
  - `Meal` / `MealItem` (食事スロットとアイテム)
  - `StoolLog` (うんちログ)
- よく使うコマンド:
```bash
# モデル変更 → マイグレーション
npx prisma migrate dev --name <change>

# DB の状態を確認
npx prisma studio

# リセット (注意: 全消し)
npx prisma migrate reset
```

---

## 開発スクリプト
```jsonc
// package.json 抜粋
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:studio": "prisma studio"
  }
}
```

---

## ディレクトリ構成
```
src/
├─ app/
│  ├─ page.tsx            # ホーム (カード + クイックアクション)
│  ├─ calendar/           # カレンダー & API
│  ├─ cat/                # 猫の一覧/新規/詳細/編集
│  ├─ api/                # Next.js Route Handlers (REST)
│  └─ globals.css         # Tailwind & かわいいユーティリティ
├─ components/
│  ├─ Header.tsx          # 右上ナビ (ホーム/猫スイッチャー)
│  ├─ calendar/           # カレンダー UI (Main/DayEditor など)
│  └─ cat/                # CatEditor ほか
├─ hooks/                 # useActiveCat など
└─ lib/                   # prisma クライアント 等
prisma/
├─ schema.prisma
└─ dev.db (自動生成)
```

---

## ページ一覧
- `/` : ホーム
- `/calendar` : 月表示・モーダル編集
- `/cat` : 猫の一覧 (右上に「新規登録」)
- `/cat/new` : 新規猫プロフィール (アバター選択対応)
- `/cat/[id]` : 詳細/編集 (アバター編集対応)
- `/search` / `/scan` : 商品検索・バーコード (実装状況に依存)

---

## かわいい UI の使い方
`src/app/globals.css` にユーティリティが定義されています。要素にクラスを“足すだけ”で統一デザインに。

### よく使うクラス
| 目的 | クラス | 効果 |
|---|---|---|
| 右上ナビ/リンク | `nav-pill focus-ring tap-target paw-hover` | ピル型 + フォーカスリング + 肉球ホバー |
| 一般ボタン | `btn-cute focus-ring tap-target paw-hover` | 白背景の丸角ボタン |
| 強調ボタン | `btn-cute btn-primary-cute` | 薄ピンクの主ボタン |
| カード | `card-cute hover-lift card-ears paw-hover` | 白カード + ホバーで浮く + 猫耳 |
| 入力欄 | `input-cute` | 白背景 + 角丸 + 見やすいプレースホルダ |
| セクション見出し | `section-title` | 太字・濃色で視認性UP |

> 既存の `bg-*` で黒くなる場合は外して、上記クラスに寄せてください。

### 例 (ホーム・カード内リンク)
```tsx
<Link href="/calendar" className="btn-cute focus-ring tap-target paw-hover">
  カレンダーを開く
</Link>
```

---

## AI 栄養コメント (任意)
AI を使わない場合でも、**kcal 差分の表示だけは動作**します。AI 解説を有効にしたい場合は以下。

1. 環境変数に `OPENAI_API_KEY` を追加
2. 依存関係の都合で、必要なら互換バージョンを利用
   - npm の例:
     ```bash
     # 依存競合がある場合のみ
     npm i openai@4 zod@3 --legacy-peer-deps
     ```
3. 開発サーバー再起動

> 競合が重い場合は、この機能は OFF のままで OK です (栄養カードは通常表示されます)。

---

## よくあるエラーと対処
**Q. `openai` の型エラー/依存競合が出る**  
A. 上記の「AI 栄養コメント (任意)」を参照。使わない場合は何もしなくて構いません。

**Q. NextAuth で `CLIENT_FETCH_ERROR` が出る**  
A. `.env` の `NEXTAUTH_URL` / `NEXTAUTH_SECRET` を設定し、ブラウザのクッキーを削除、サーバーを再起動してください。

**Q. 右上ナビやモーダルの文字が薄い/見えない**  
A. `globals.css` のコントラスト補正が適用されます。独自 `text-*` を上書きしていないか確認。

**Q. 見た目が黒っぽくなる**  
A. `hover:bg-*` などの Tailwind を外し、`btn-cute` / `nav-pill` に統一してください。

---

## デプロイ
### Vercel (推奨)
1. GitHub 連携で Import
2. ルートに `.env` を設定 (最低限 `DATABASE_URL` と `NEXTAUTH_SECRET`)
3. Build & Deploy

### 自前サーバー
- Node.js 18+ / SQLite で動作します。
- `npm run build && npm run start` を実行し、リバースプロキシ (Nginx など) を前段に配置してください。

> 外部の人でも、**ローカル or Vercel** で簡単に立てられます。DB が SQLite なので追加のミドルウェア不要です。

---

## ライセンス
- 本リポジトリのコード: プロジェクトに合わせて追記してください (例: MIT)。
- データ/画像: 各ファイルのヘッダ記載/著作権に従ってください。

---

### 補足
- README の内容は実装の更新に合わせて適宜調整してください。
- 迷ったら `src/app/globals.css` と `components/` を見ると全体像が掴みやすいです。

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

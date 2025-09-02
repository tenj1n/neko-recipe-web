"use client";  // このコンポーネントはクライアントサイドで動作する

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const r = useRouter(); // ページ遷移用フック
  const [email, setEmail] = useState("");      // 入力されたメールを保持
  const [password, setPassword] = useState(""); // 入力されたパスワードを保持
  const [msg, setMsg] = useState<string | null>(null); // エラーメッセージ表示用
  const [loading, setLoading] = useState(false);       // 「登録中…」の状態管理

  // フォーム送信時の処理
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();    // デフォルトのフォーム送信をキャンセル
    setMsg(null);          // エラーメッセージをリセット
    setLoading(true);      // ローディング開始
    try {
      // /api/register にPOSTリクエストを送信
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // 成功した場合は必ずログイン画面に戻す
        r.push("/login");
      } else {
        // 失敗した場合はエラーメッセージを表示
        const j = await res.json().catch(() => ({}));
        setMsg(j?.error ?? "登録に失敗しました");
      }
    } catch {
      // ネットワークエラー時
      setMsg("ネットワークエラーが発生しました");
    } finally {
      setLoading(false); // ローディング終了
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">新規登録</h1>

        {/* メール入力欄 */}
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* パスワード入力欄 */}
        <input
          className="w-full border p-2 rounded"
          placeholder="Password（8文字以上）"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {/* エラーメッセージがある場合のみ表示 */}
        {msg && <p className="text-red-500 text-sm">{msg}</p>}

        {/* 登録ボタン */}
        <button
          className="w-full border p-2 rounded font-semibold disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "登録中..." : "登録"}
        </button>

        {/* ログインページへのリンク */}
        <p className="text-sm text-center">
          既にアカウントがあります？{" "}
          <a href="/login" className="underline">ログイン</a>
        </p>
      </form>
    </main>
  );
}

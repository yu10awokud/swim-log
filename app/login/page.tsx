"use client";

import { useActionState } from "react";
import { login } from "./actions";

// 新規登録の画面はありません。アカウントは Supabase のダッシュボードで作成します。
export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form action={formAction} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-700">Swim Log</h1>
          <p className="mt-1 text-sm text-slate-500">水泳の練習・試合記録</p>
        </div>
        <div>
          <label htmlFor="email" className="label">
            メールアドレス
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            パスワード
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full py-3">
          {pending ? "ログイン中…" : "ログイン"}
        </button>
      </form>
    </main>
  );
}

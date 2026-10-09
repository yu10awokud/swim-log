import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * サーバー（ページ・Server Action）専用の Supabase クライアント。
 *
 * Secret key を使うので、データベースの保護（RLS）を通り抜けて全データを読み書きできます。
 * そのため "server-only" にしてあり、ブラウザ側のコードからは読み込めません。
 * データベースには、このサーバー経由でしかアクセスできない仕組みです。
 */
export function getSupabase() {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!SUPABASE_URL || !secretKey) {
    throw new Error(
      "環境変数 NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SECRET_KEY が設定されていません。" +
        "Vercel の Settings → Environment Variables（ローカルでは .env.local）を確認してください。",
    );
  }
  return createClient(SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

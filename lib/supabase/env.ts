// Supabase の接続先。値は .env.local（ローカル）と Vercel の環境変数から読み込みます。

/**
 * Project URL（ブラウザとサーバーの両方で使う）
 * 「https://xxxx.supabase.co/rest/v1/」のように余分な部分が付いていても動くよう、
 * 「https://xxxx.supabase.co」の部分だけを取り出して使います。
 */
export const SUPABASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Publishable key（ブラウザで画像を送るときだけ使う。これだけではデータは読めない） */
export const SUPABASE_PUBLISHABLE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

function normalizeUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
}

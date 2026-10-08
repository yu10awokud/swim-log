// Supabase の接続先。値は .env.local（ローカル）と Vercel の環境変数から読み込みます。

/** Project URL（ブラウザとサーバーの両方で使う） */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Publishable key（ブラウザで画像を送るときだけ使う。これだけではデータは読めない） */
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

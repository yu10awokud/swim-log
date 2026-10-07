// Supabase の接続先。値は .env.local（ローカル）と Vercel の環境変数から読み込みます。
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

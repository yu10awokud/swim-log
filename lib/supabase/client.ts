import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/**
 * ブラウザ用の Supabase クライアント。
 * サーバーが発行した「アップロード用の一時的な許可」を使って画像を送るときだけ使います。
 */
export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

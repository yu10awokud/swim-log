import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dbErrorMessage } from "./errors";
import type { Pool, Stroke } from "./types";

/** 種目マスタとプールマスタを並び順どおりに取得します。読み込みに失敗したら loadError に理由が入ります。 */
export async function fetchMasters(supabase: SupabaseClient) {
  const [strokesRes, poolsRes] = await Promise.all([
    supabase.from("strokes").select("id, code, name, sort_order").order("sort_order").order("created_at"),
    supabase.from("pools").select("id, name, course, sort_order").order("sort_order").order("created_at"),
  ]);
  const error = strokesRes.error ?? poolsRes.error;
  return {
    strokes: (strokesRes.data ?? []) as Stroke[],
    pools: (poolsRes.data ?? []) as Pool[],
    loadError: error ? dbErrorMessage(error) : null,
  };
}

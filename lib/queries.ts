import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pool, Stroke } from "./types";

/** 種目マスタとプールマスタを並び順どおりに取得します。 */
export async function fetchMasters(supabase: SupabaseClient) {
  const [{ data: strokes }, { data: pools }] = await Promise.all([
    supabase.from("strokes").select("id, code, name, sort_order").order("sort_order").order("created_at"),
    supabase.from("pools").select("id, name, course, sort_order").order("sort_order").order("created_at"),
  ]);
  return { strokes: (strokes ?? []) as Stroke[], pools: (pools ?? []) as Pool[] };
}

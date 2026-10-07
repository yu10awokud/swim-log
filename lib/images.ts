import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const IMAGE_BUCKET = "practice-images";

/** Storage のパス一覧から、1 時間だけ有効な閲覧用 URL を作ります（パス → URL の対応表）。 */
export async function signedUrlMap(supabase: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60);
  if (error) {
    console.error(error);
    return map;
  }
  for (const item of data) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

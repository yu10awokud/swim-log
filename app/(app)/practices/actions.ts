"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { dbErrorMessage } from "@/lib/errors";
import { isValidDate } from "@/lib/date";
import { IMAGE_BUCKET } from "@/lib/images";
import type { ActionResult } from "@/lib/types";

const practiceSchema = z.object({
  id: z.string().uuid(),
  practice_date: z.string().refine(isValidDate, "日付が正しくありません"),
  pool_id: z.string().uuid("プールを選択してください"),
  total_distance: z.number().int().min(0, "総距離は 0 以上にしてください").max(100000, "総距離が大きすぎます"),
  memo: z.string().max(5000, "メモが長すぎます"),
  times: z
    .array(
      z.object({
        format: z.enum(["TT", "Short", "Middle"]),
        stroke_id: z.string().uuid("タイムの種目を選択してください"),
        distance: z.number().int().min(1, "タイムの距離を入力してください").max(10000),
        time_cs: z.number().int().min(1, "タイムを正しく入力してください").max(99999999),
      }),
    )
    .max(100),
  new_image_paths: z.array(z.string()).max(30),
  removed_image_ids: z.array(z.string().uuid()).max(100),
});

export type PracticeInput = z.infer<typeof practiceSchema>;

/** 練習記録を保存します（新規・編集共通）。画像はブラウザから Storage へアップロード済みの前提です。 */
export async function savePractice(input: PracticeInput): Promise<ActionResult> {
  const parsed = practiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const p = parsed.data;

  const { supabase, user } = await requireUser();

  // 画像のパスは必ず「自分のID/この練習のID/…」の形でなければ受け付けない
  const prefix = `${user.id}/${p.id}/`;
  if (p.new_image_paths.some((path) => !path.startsWith(prefix) || path.includes(".."))) {
    return { ok: false, error: "画像の保存場所が正しくありません。" };
  }

  // 1. 練習本体（あれば更新、なければ追加）
  const values = {
    practice_date: p.practice_date,
    pool_id: p.pool_id,
    total_distance: p.total_distance,
    memo: p.memo.trim(),
  };
  const { data: existing } = await supabase.from("practices").select("id").eq("id", p.id).maybeSingle();
  const { error: practiceError } = existing
    ? await supabase.from("practices").update(values).eq("id", p.id)
    : await supabase.from("practices").insert({ id: p.id, ...values });
  if (practiceError) return { ok: false, error: dbErrorMessage(practiceError) };

  // 2. タイム：いったん全部消して入れ直す
  const { error: deleteTimesError } = await supabase.from("time_records").delete().eq("practice_id", p.id);
  if (deleteTimesError) return { ok: false, error: dbErrorMessage(deleteTimesError) };
  if (p.times.length > 0) {
    const { error } = await supabase
      .from("time_records")
      .insert(p.times.map((t, i) => ({ ...t, practice_id: p.id, sort_order: i + 1 })));
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }

  // 3. 削除する画像（Storage のファイルと行の両方）
  if (p.removed_image_ids.length > 0) {
    const { data: removed } = await supabase
      .from("practice_images")
      .select("id, storage_path")
      .eq("practice_id", p.id)
      .in("id", p.removed_image_ids);
    if (removed && removed.length > 0) {
      await supabase.storage.from(IMAGE_BUCKET).remove(removed.map((r) => r.storage_path));
      const { error } = await supabase
        .from("practice_images")
        .delete()
        .in(
          "id",
          removed.map((r) => r.id),
        );
      if (error) return { ok: false, error: dbErrorMessage(error) };
    }
  }

  // 4. 追加した画像
  if (p.new_image_paths.length > 0) {
    const { data: last } = await supabase
      .from("practice_images")
      .select("sort_order")
      .eq("practice_id", p.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const start = (last?.sort_order ?? 0) + 1;
    const { error } = await supabase
      .from("practice_images")
      .insert(p.new_image_paths.map((path, i) => ({ practice_id: p.id, storage_path: path, sort_order: start + i })));
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** 練習記録を削除します（タイム・画像も一緒に消えます）。 */
export async function deletePractice(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "不正な操作です。" };
  const { supabase } = await requireUser();

  const { data: images } = await supabase.from("practice_images").select("storage_path").eq("practice_id", id);
  if (images && images.length > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove(images.map((img) => img.storage_path));
  }

  const { error } = await supabase.from("practices").delete().eq("id", id);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

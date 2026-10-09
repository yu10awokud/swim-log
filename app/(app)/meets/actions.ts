"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { dbErrorMessage } from "@/lib/errors";
import { isValidDate } from "@/lib/date";
import type { ActionResult } from "@/lib/types";
import { withoutEmptyLaps } from "@/lib/laps";

const meetSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1, "大会名を入力してください").max(100, "大会名が長すぎます"),
  meet_date: z.string().refine(isValidDate, "日付が正しくありません"),
  venue: z.string().trim().max(100, "会場名が長すぎます"),
  course: z.enum(["SC", "LC"]),
  results: z
    .array(
      z.object({
        stroke_id: z.string().uuid("種目を選択してください"),
        distance: z.number().int().min(1, "距離を入力してください").max(10000),
        time_cs: z.number().int().min(1, "タイムを正しく入力してください").max(99999999),
        note: z.string().trim().max(100, "備考が長すぎます"),
        laps_cs: z.array(z.number().int().min(1).max(99999999).nullable()).max(60).nullable().optional(),
      }),
    )
    .max(50),
});

export type MeetInput = z.infer<typeof meetSchema>;

/** 大会と結果を保存します（新規・編集共通）。 */
export async function saveMeet(input: MeetInput): Promise<ActionResult> {
  const parsed = meetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, results, ...values } = parsed.data;

  const supabase = getSupabase();

  let meetId = id;
  if (meetId) {
    const { error } = await supabase.from("meets").update(values).eq("id", meetId);
    if (error) return { ok: false, error: dbErrorMessage(error) };
  } else {
    const { data, error } = await supabase.from("meets").insert(values).select("id").single();
    if (error) return { ok: false, error: dbErrorMessage(error) };
    meetId = data.id as string;
  }

  // 結果：いったん全部消して入れ直す
  const { error: deleteError } = await supabase.from("meet_results").delete().eq("meet_id", meetId);
  if (deleteError) return { ok: false, error: dbErrorMessage(deleteError) };
  if (results.length > 0) {
    const { error } = await supabase
      .from("meet_results")
      .insert(results.map((r, i) => ({ ...withoutEmptyLaps(r), meet_id: meetId, sort_order: i + 1 })));
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMeet(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "不正な操作です。" };
  const supabase = getSupabase();
  const { error } = await supabase.from("meets").delete().eq("id", id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath("/", "layout");
  return { ok: true };
}

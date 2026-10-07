"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { dbErrorMessage } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

type MasterTable = "strokes" | "pools";
const MASTER_TABLES: MasterTable[] = ["strokes", "pools"];

const strokeSchema = z.object({
  code: z.string().trim().min(1, "略称を入力してください").max(20),
  name: z.string().trim().max(50),
});

const poolSchema = z.object({
  name: z.string().trim().min(1, "プール名を入力してください").max(50),
  course: z.enum(["SC", "LC"]),
});

function done(): ActionResult {
  revalidatePath("/", "layout");
  return { ok: true };
}

/** 追加（id なし）または更新（id あり） */
export async function saveStroke(id: string | null, input: { code: string; name: string }): Promise<ActionResult> {
  const parsed = strokeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return saveRow("strokes", id, parsed.data);
}

export async function savePool(id: string | null, input: { name: string; course: string }): Promise<ActionResult> {
  const parsed = poolSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return saveRow("pools", id, parsed.data);
}

async function saveRow(table: MasterTable, id: string | null, values: Record<string, string>): Promise<ActionResult> {
  const { supabase } = await requireUser();

  if (id) {
    const { error } = await supabase.from(table).update(values).eq("id", id);
    if (error) return { ok: false, error: dbErrorMessage(error) };
  } else {
    // 新しい行は一番下に追加する
    const { data: last } = await supabase
      .from(table)
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from(table).insert({ ...values, sort_order: (last?.sort_order ?? 0) + 1 });
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }
  return done();
}

export async function deleteMaster(table: MasterTable, id: string): Promise<ActionResult> {
  if (!MASTER_TABLES.includes(table)) return { ok: false, error: "不正な操作です。" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  return done();
}

/** 並び順を 1 つ上（-1）または下（+1）へ動かします。 */
export async function moveMaster(table: MasterTable, id: string, direction: -1 | 1): Promise<ActionResult> {
  if (!MASTER_TABLES.includes(table) || (direction !== -1 && direction !== 1)) return { ok: false, error: "不正な操作です。" };
  const { supabase } = await requireUser();
  const { data: rows, error } = await supabase
    .from(table)
    .select("id, sort_order")
    .order("sort_order")
    .order("created_at");
  if (error) return { ok: false, error: dbErrorMessage(error) };

  const index = rows.findIndex((row) => row.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rows.length) return { ok: true };

  // 並び順を 1, 2, 3, … に振り直してから入れ替える（重複した値があっても確実に動くように）
  const ordered = rows.map((row) => row.id);
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  for (let i = 0; i < ordered.length; i++) {
    const { error: updateError } = await supabase.from(table).update({ sort_order: i + 1 }).eq("id", ordered[i]);
    if (updateError) return { ok: false, error: dbErrorMessage(updateError) };
  }
  return done();
}

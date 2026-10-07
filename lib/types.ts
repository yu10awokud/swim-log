// データベースの各テーブルの形（画面で使う分だけ）

export type Course = "SC" | "LC";
export type TimeFormat = "TT" | "Short" | "Middle";

export const COURSE_LABEL: Record<Course, string> = { SC: "短水路", LC: "長水路" };
export const TIME_FORMATS: TimeFormat[] = ["TT", "Short", "Middle"];
export const DISTANCE_PRESETS = [25, 50, 100, 200, 400, 800, 1500];

export type Stroke = { id: string; code: string; name: string; sort_order: number };
export type Pool = { id: string; name: string; course: Course; sort_order: number };

export type TimeRecord = {
  id: string;
  format: TimeFormat;
  stroke_id: string;
  distance: number;
  time_cs: number;
  sort_order: number;
};

export type PracticeImage = { id: string; storage_path: string; sort_order: number };

export type Practice = {
  id: string;
  practice_date: string;
  pool_id: string;
  total_distance: number;
  memo: string;
};

export type Meet = { id: string; name: string; meet_date: string; venue: string; course: Course };

export type MeetResult = {
  id: string;
  stroke_id: string;
  distance: number;
  time_cs: number;
  note: string;
  sort_order: number;
};

/** プールの表示名：「踏水会（短水路）」 */
export function poolLabel(pool: Pick<Pool, "name" | "course">): string {
  return `${pool.name}（${COURSE_LABEL[pool.course]}）`;
}

/** 種目の表示名：「Ba 背泳ぎ」 */
export function strokeLabel(stroke: Pick<Stroke, "code" | "name">): string {
  return stroke.name ? `${stroke.code} ${stroke.name}` : stroke.code;
}

/** Server Action の戻り値（フォームにエラーを表示するため） */
export type ActionResult = { ok: true } | { ok: false; error: string };

import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { formatTime } from "@/lib/time";
import { COURSE_LABEL, type Course } from "@/lib/types";

type BestRow = {
  stroke_id: string;
  stroke_code: string;
  stroke_name: string;
  stroke_sort_order: number;
  distance: number;
  time_cs: number;
  meet_id: string;
  meet_name: string;
  meet_date: string;
};

// ベストは「試合記録」だけが対象です（集計は supabase/schema.sql の best_times ビュー）。
export default async function BestsPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const params = await searchParams;
  const course: Course = params.course === "LC" ? "LC" : "SC";
  const supabase = getSupabase();

  const { data } = await supabase
    .from("best_times")
    .select("stroke_id, stroke_code, stroke_name, stroke_sort_order, distance, time_cs, meet_id, meet_name, meet_date")
    .eq("course", course);

  const rows = ((data ?? []) as BestRow[]).sort(
    (a, b) => a.stroke_sort_order - b.stroke_sort_order || a.stroke_code.localeCompare(b.stroke_code) || a.distance - b.distance,
  );

  // 種目ごとにまとめる
  const groups: { code: string; name: string; rows: BestRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.code === row.stroke_code) last.rows.push(row);
    else groups.push({ code: row.stroke_code, name: row.stroke_name, rows: [row] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">ベスト</h1>
        <p className="text-sm text-slate-500">試合記録の中から、種目×距離ごとの最速タイムを表示します。</p>
      </div>

      <div className="flex rounded-lg bg-slate-200 p-1 text-sm font-semibold">
        {(["SC", "LC"] as Course[]).map((c) => (
          <Link
            key={c}
            href={`/bests?course=${c}`}
            replace
            className={`flex-1 rounded-md py-2 text-center ${course === c ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"}`}
          >
            {COURSE_LABEL[c]}
          </Link>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="card text-sm text-slate-500">
          {COURSE_LABEL[course]}の試合記録がまだありません。
          <Link href="/meets/new" className="ml-1 text-brand-700 underline">
            試合記録を追加
          </Link>
        </p>
      )}

      {groups.map((group) => (
        <section key={group.code} className="card p-0">
          <h2 className="border-b border-slate-100 px-4 py-2 font-semibold">
            {group.code}
            <span className="ml-2 text-sm font-normal text-slate-500">{group.name}</span>
          </h2>
          <ul className="divide-y divide-slate-100">
            {group.rows.map((row) => (
              <li key={`${row.stroke_id}-${row.distance}`}>
                <Link href={`/meets#meet-${row.meet_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="w-16 shrink-0 text-sm text-slate-600">{row.distance}m</span>
                  <span className="w-24 shrink-0 text-right font-mono text-lg font-bold tabular-nums text-brand-700">
                    {formatTime(row.time_cs)}
                  </span>
                  <span className="min-w-0 flex-1 text-right text-xs text-slate-500">
                    <span className="block truncate">{row.meet_name}</span>
                    <span>{row.meet_date.replaceAll("-", "/")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

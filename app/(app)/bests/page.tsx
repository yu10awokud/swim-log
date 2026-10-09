import Link from "next/link";
import { TrophyIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
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
    <div className="panel space-y-4">
      <PageHeader
        icon={<TrophyIcon className="h-6 w-6" />}
        title="ベスト"
        subtitle="試合記録からの最速タイム"
      />

      <div className="seg">
        {(["SC", "LC"] as Course[]).map((c) => (
          <Link
            key={c}
            href={`/bests?course=${c}`}
            replace
            className={`seg-item ${course === c ? "seg-item-active" : ""}`}
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
          <h2 className="section-title border-b border-slate-100 px-4 py-3">
            {group.code}
            <span className="ml-2 text-sm font-normal text-slate-500">{group.name}</span>
          </h2>
          <ul className="divide-y divide-slate-100">
            {group.rows.map((row) => (
              <li key={`${row.stroke_id}-${row.distance}`}>
                <Link href={`/meets#meet-${row.meet_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="w-16 shrink-0 text-sm text-slate-600">{row.distance}m</span>
                  <span className="w-24 shrink-0 text-right font-mono text-lg font-extrabold tabular-nums text-navy-900">
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

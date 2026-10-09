import { getSupabase } from "@/lib/supabase/server";
import { ChartIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { addMonths, todayJST } from "@/lib/date";
import type { Course } from "@/lib/types";
import AnalysisCharts, { type MonthPoint, type TTPoint } from "./AnalysisCharts";

export default async function AnalysisPage() {
  const supabase = getSupabase();
  const thisMonth = todayJST().slice(0, 7);
  const firstMonth = addMonths(thisMonth, -11);

  const [{ data: tt }, { data: monthly }] = await Promise.all([
    // 分析に使うのは形式が TT のタイムだけ
    supabase
      .from("time_records")
      .select("id, distance, time_cs, strokes(code, sort_order), practices(practice_date, pools(course))")
      .eq("format", "TT"),
    supabase.from("monthly_distance").select("month, total_distance, practice_days").gte("month", `${firstMonth}-01`),
  ]);

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

  const ttPoints: TTPoint[] = [];
  for (const r of tt ?? []) {
    const stroke = one(r.strokes) as { code: string; sort_order: number } | null;
    const practice = one(r.practices) as { practice_date: string; pools: unknown } | null;
    const pool = one(practice?.pools as { course: Course } | { course: Course }[] | null);
    if (!stroke || !practice || !pool) continue;
    ttPoints.push({
      id: r.id,
      date: practice.practice_date,
      strokeCode: stroke.code,
      strokeOrder: stroke.sort_order,
      distance: r.distance,
      course: pool.course,
      timeCs: r.time_cs,
    });
  }

  // 直近 12 か月（練習のない月も 0 として並べる）
  const byMonth = new Map((monthly ?? []).map((m) => [String(m.month).slice(0, 7), m]));
  const months: MonthPoint[] = Array.from({ length: 12 }, (_, i) => {
    const month = addMonths(firstMonth, i);
    const m = byMonth.get(month);
    return { month, distance: m?.total_distance ?? 0, days: m?.practice_days ?? 0 };
  });

  return (
    <div className="panel space-y-4">
      <PageHeader icon={<ChartIcon className="h-6 w-6" />} title="分析" subtitle="TTタイムの推移と練習量" />
      <AnalysisCharts ttPoints={ttPoints} months={months} />
    </div>
  );
}

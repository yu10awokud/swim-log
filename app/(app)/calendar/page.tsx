import Link from "next/link";
import StatCard from "@/components/StatCard";
import { CalendarIcon, ChevronLeft, ChevronRight, GaugeIcon, PlusIcon, SwimIcon } from "@/components/Icons";
import { getSupabase } from "@/lib/supabase/server";
import { addMonths, daysInMonth, firstWeekday, isValidMonth, todayJST } from "@/lib/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 距離に応じたセルの色（多いほど濃い）。基準を変えたいときはここを直します。 */
const LEVELS = [
  { min: 7000, className: "border-brand-400 bg-brand-100", label: "7000〜" },
  { min: 5000, className: "border-brand-300 bg-brand-50", label: "5000〜" },
  { min: 3000, className: "border-brand-200 bg-sky-50", label: "3000〜" },
  { min: 1, className: "border-brand-100 bg-sky-50/50", label: "〜2999" },
];
const levelClass = (distance: number) => LEVELS.find((l) => distance >= l.min)?.className ?? "";

/** 5000 → "5.0k"、 800 → "800" */
const shortDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}k` : String(m));

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const today = todayJST();
  const month = params.month && isValidMonth(params.month) ? params.month : today.slice(0, 7);
  const days = daysInMonth(month);
  const supabase = getSupabase();

  const { data } = await supabase
    .from("practices")
    .select("practice_date, total_distance, created_at, pools(name)")
    .order("created_at")
    .gte("practice_date", `${month}-01`)
    .lte("practice_date", `${month}-${String(days).padStart(2, "0")}`);

  // 日付ごとの合計距離と、泳いだプール名（二部練でプールが違えば両方）
  const byDate = new Map<string, number>();
  const poolsByDate = new Map<string, string[]>();
  for (const p of data ?? []) {
    byDate.set(p.practice_date, (byDate.get(p.practice_date) ?? 0) + p.total_distance);
    const pool = (Array.isArray(p.pools) ? p.pools[0] : p.pools) as { name: string } | null;
    if (pool) {
      const names = poolsByDate.get(p.practice_date) ?? [];
      if (!names.includes(pool.name)) names.push(pool.name);
      poolsByDate.set(p.practice_date, names);
    }
  }
  const monthTotal = [...byDate.values()].reduce((a, b) => a + b, 0);
  const practiceDays = byDate.size;

  // カレンダーのマス（月初の曜日まで空白で埋める）
  const blanks = firstWeekday(month);
  const cells: (string | null)[] = [
    ...Array<null>(blanks).fill(null),
    ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const [y, m] = month.split("-").map(Number);

  return (
    <div className="panel space-y-3 sm:space-y-4">
      {/* 月の切り替え */}
      <div className="flex items-center justify-between">
        <Link href={`/calendar?month=${addMonths(month, -1)}`} className="btn-square" aria-label="前の月">
          <ChevronLeft />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-bold text-navy-900">
            {y}年{m}月
          </h1>
          {month !== today.slice(0, 7) && (
            <Link href="/calendar" className="text-xs font-semibold text-brand-600">
              今月へ戻る
            </Link>
          )}
        </div>
        <Link href={`/calendar?month=${addMonths(month, 1)}`} className="btn-square" aria-label="次の月">
          <ChevronRight />
        </Link>
      </div>

      {/* 月の集計 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          label="合計距離"
          value={monthTotal.toLocaleString()}
          unit="m"
          icon={<SwimIcon className="h-7 w-7" />}
          tone="sky"
          deco="wave"
        />
        <StatCard
          label="練習日数"
          value={String(practiceDays)}
          unit="日"
          icon={<CalendarIcon className="h-7 w-7" />}
          tone="indigo"
          deco="bars"
        />
        <StatCard
          label="1日平均"
          value={practiceDays ? Math.round(monthTotal / practiceDays).toLocaleString() : "-"}
          unit={practiceDays ? "m" : ""}
          icon={<GaugeIcon className="h-7 w-7" />}
          tone="teal"
          deco="curve"
        />
      </div>

      {/* カレンダー本体 */}
      <div className="card p-2 sm:p-5">
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] sm:mb-1.5 sm:gap-1.5 sm:text-sm">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`rounded-md py-1 sm:py-1.5 ${
                i === 0 ? "bg-red-50/70 text-red-400" : i === 6 ? "bg-blue-50/70 text-blue-500" : "bg-slate-50 text-slate-600"
              }`}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((date, i) => {
            if (!date) return <div key={`blank-${i}`} className="aspect-[4/5] rounded-lg border border-slate-100 bg-white/50 sm:aspect-auto sm:min-h-[84px]" />;
            const distance = byDate.get(date) ?? 0;
            const poolNames = poolsByDate.get(date) ?? [];
            const weekday = i % 7;
            const isToday = date === today;
            return (
              <Link
                key={date}
                href={`/day/${date}`}
                className={`flex aspect-[4/5] min-w-0 flex-col overflow-hidden rounded-lg border px-1 pb-1 pt-1 transition active:scale-95 sm:aspect-auto sm:min-h-[84px] sm:rounded-lg sm:px-2 sm:pt-1.5 ${
                  distance ? `${levelClass(distance)} border` : "border-slate-100 bg-white hover:bg-slate-50"
                } ${isToday ? "ring-1 ring-amber-300" : ""}`}
              >
                <span
                  className={`text-[11px] sm:text-xs ${
                    weekday === 0 ? "text-red-400" : weekday === 6 ? "text-blue-500" : "text-navy-800"
                  }`}
                >
                  {Number(date.slice(8))}
                </span>
                {distance > 0 && (
                  <span className="mt-auto flex flex-col items-center text-navy-800">
                    <SwimIcon className="hidden h-4 w-4 text-brand-400 sm:block" />
                    <span className="text-[11px] font-bold leading-tight tabular-nums sm:text-sm">
                      {shortDistance(distance)}
                    </span>
                    {poolNames.length > 0 && (
                      <span className="w-full truncate text-center text-[9px] leading-tight text-navy-700/80 sm:text-[10px]">
                        {poolNames.join("/")}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="mt-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-slate-500">
          {[...LEVELS].reverse().map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded border-2 ${l.className}`} />
              {l.label}m
            </span>
          ))}
        </div>
      </div>

      <Link href="/practices/new" className="btn-primary w-full py-2.5 text-sm">
        <PlusIcon /> 今日の記録を入力
      </Link>
    </div>
  );
}

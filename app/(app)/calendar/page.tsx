import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { addMonths, daysInMonth, firstWeekday, isValidMonth, todayJST } from "@/lib/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 距離に応じたセルの色（多いほど濃い）。基準を変えたいときはここを直します。 */
const LEVELS = [
  { min: 7000, className: "bg-brand-600 text-white", label: "7000〜" },
  { min: 5000, className: "bg-brand-400 text-white", label: "5000〜" },
  { min: 3000, className: "bg-brand-200 text-brand-900", label: "3000〜" },
  { min: 1, className: "bg-brand-100 text-brand-900", label: "〜2999" },
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
    .select("practice_date, total_distance")
    .gte("practice_date", `${month}-01`)
    .lte("practice_date", `${month}-${String(days).padStart(2, "0")}`);

  // 日付ごとの合計距離
  const byDate = new Map<string, number>();
  for (const p of data ?? []) byDate.set(p.practice_date, (byDate.get(p.practice_date) ?? 0) + p.total_distance);
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
    <div className="space-y-4">
      {/* 月の切り替え */}
      <div className="flex items-center justify-between">
        <Link href={`/calendar?month=${addMonths(month, -1)}`} className="btn-secondary h-10 w-10 p-0" aria-label="前の月">
          ‹
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold">
            {y}年{m}月
          </h1>
          {month !== today.slice(0, 7) && (
            <Link href="/calendar" className="text-xs text-brand-700">
              今月へ
            </Link>
          )}
        </div>
        <Link href={`/calendar?month=${addMonths(month, 1)}`} className="btn-secondary h-10 w-10 p-0" aria-label="次の月">
          ›
        </Link>
      </div>

      {/* 月の集計 */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="合計距離" value={monthTotal.toLocaleString()} unit="m" />
        <Stat label="練習日数" value={String(practiceDays)} unit="日" />
        <Stat
          label="1日平均"
          value={practiceDays ? Math.round(monthTotal / practiceDays).toLocaleString() : "-"}
          unit={practiceDays ? "m" : ""}
        />
      </div>

      {/* カレンダー本体 */}
      <div className="card p-2">
        <div className="grid grid-cols-7 text-center text-xs font-semibold">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-1 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-500"}`}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={`blank-${i}`} />;
            const distance = byDate.get(date) ?? 0;
            const weekday = i % 7;
            const isToday = date === today;
            return (
              <Link
                key={date}
                href={`/day/${date}`}
                className={`flex aspect-square flex-col items-center justify-start rounded-lg pt-1 text-sm transition active:scale-95 ${
                  distance ? levelClass(distance) : "hover:bg-slate-100"
                } ${isToday ? "ring-2 ring-amber-400" : ""}`}
              >
                <span
                  className={`text-xs ${
                    distance ? "" : weekday === 0 ? "text-red-500" : weekday === 6 ? "text-blue-500" : "text-slate-600"
                  }`}
                >
                  {Number(date.slice(8))}
                </span>
                {distance > 0 && (
                  <span className="mt-auto pb-1 text-[11px] font-bold leading-none tabular-nums sm:text-sm">
                    {shortDistance(distance)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
        {[...LEVELS].reverse().map((l) => (
          <span key={l.label} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded ${l.className}`} />
            {l.label}m
          </span>
        ))}
      </div>

      <Link href="/practices/new" className="btn-primary w-full py-3 text-base">
        ＋ 今日の記録を入力
      </Link>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums text-slate-800">
        {value}
        <span className="ml-0.5 text-xs font-normal text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

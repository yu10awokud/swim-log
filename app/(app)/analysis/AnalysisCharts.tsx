"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTime } from "@/lib/time";
import StatCard from "@/components/StatCard";
import { ChartIcon, ClockIcon, GaugeIcon, SwimIcon, TrophyIcon } from "@/components/Icons";
import { COURSE_LABEL, type Course } from "@/lib/types";

export type TTPoint = {
  id: string;
  date: string;
  strokeCode: string;
  strokeOrder: number;
  distance: number;
  course: Course;
  timeCs: number;
};
export type MonthPoint = { month: string; distance: number; days: number };

// グラフの色（アプリのメインカラーに合わせています）
const SERIES = "#1e5bb8";
const GRID = "#e2e8f0";
const AXIS = "#64748b";

export default function AnalysisCharts({ ttPoints, months }: { ttPoints: TTPoint[]; months: MonthPoint[] }) {
  const [tab, setTab] = useState<"tt" | "monthly">("tt");

  return (
    <div className="space-y-4">
      <div className="seg">
        {[
          { key: "tt" as const, label: "TT推移" },
          { key: "monthly" as const, label: "月別距離" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`seg-item ${tab === t.key ? "seg-item-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "tt" ? <TTChart points={ttPoints} /> : <MonthlyChart months={months} />}
    </div>
  );
}

// ---------------------------------------------------------------------
// TT タイムの推移
// ---------------------------------------------------------------------

function TTChart({ points }: { points: TTPoint[] }) {
  // 記録のある「種目×距離」の組み合わせ
  const combos = useMemo(() => {
    const map = new Map<string, { key: string; code: string; order: number; distance: number }>();
    for (const p of points) {
      const key = `${p.strokeCode}|${p.distance}`;
      if (!map.has(key)) map.set(key, { key, code: p.strokeCode, order: p.strokeOrder, distance: p.distance });
    }
    return [...map.values()].sort((a, b) => a.order - b.order || a.distance - b.distance);
  }, [points]);

  const [comboKey, setComboKey] = useState(combos[0]?.key ?? "");
  // 最初は、一番最近の TT 記録の水路を選んでおく
  const [course, setCourse] = useState<Course>(
    () => [...points].sort((a, b) => b.date.localeCompare(a.date))[0]?.course ?? "SC",
  );

  const data = useMemo(
    () =>
      points
        .filter((p) => `${p.strokeCode}|${p.distance}` === comboKey && p.course === course)
        .sort((a, b) => a.date.localeCompare(b.date) || b.timeCs - a.timeCs)
        .map((p) => ({ ...p, seconds: p.timeCs / 100 })),
    [points, comboKey, course],
  );

  if (combos.length === 0) {
    return <p className="card text-sm text-slate-500">TT の記録がまだありません。記録入力でタイムの形式を「TT」にして登録してください。</p>;
  }

  const best = data.reduce<TTPoint | null>((b, p) => (!b || p.timeCs < b.timeCs ? p : b), null);
  const latest = data[data.length - 1];

  return (
    <div className="space-y-3">
      {/* 絞り込み */}
      <div className="flex gap-2">
        <select className="input flex-1" value={comboKey} onChange={(e) => setComboKey(e.target.value)} aria-label="種目と距離">
          {combos.map((c) => (
            <option key={c.key} value={c.key}>
              {c.code} {c.distance}m
            </option>
          ))}
        </select>
        <div className="toggle shrink-0">
          {(["SC", "LC"] as Course[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCourse(c)}
              className={`toggle-item ${course === c ? "toggle-item-active" : ""}`}
            >
              {COURSE_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="card text-sm text-slate-500">この条件（{COURSE_LABEL[course]}）の TT 記録はありません。</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="ベスト"
              value={best ? formatTime(best.timeCs) : "-"}
              sub={best?.date.replaceAll("-", "/")}
              icon={<TrophyIcon className="h-6 w-6" />}
              tone="amber"
            />
            <StatCard
              label="最新"
              value={formatTime(latest.timeCs)}
              sub={latest.date.replaceAll("-", "/")}
              icon={<ClockIcon className="h-6 w-6" />}
              tone="sky"
            />
            <StatCard label="記録数" value={`${data.length}`} unit="本" icon={<ChartIcon className="h-6 w-6" />} tone="indigo" />
          </div>

          <div className="card px-1 py-3">
            <p className="mb-1 px-3 text-xs text-slate-500">上にいくほど速いタイムです</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`}
                  tick={{ fontSize: 11, fill: AXIS }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  minTickGap={16}
                />
                <YAxis
                  dataKey="seconds"
                  reversed
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  tickFormatter={(s: number) => formatTime(Math.round(s * 100))}
                  tick={{ fontSize: 11, fill: AXIS }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ stroke: AXIS, strokeDasharray: "3 3" }}
                  formatter={(value) => [formatTime(Math.round(Number(value) * 100)), "タイム"]}
                  labelFormatter={(label) => String(label).replaceAll("-", "/")}
                />
                <Line
                  type="linear"
                  dataKey="seconds"
                  stroke={SERIES}
                  strokeWidth={2}
                  dot={{ r: 4, fill: SERIES, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <details className="card text-sm">
            <summary className="cursor-pointer text-slate-600">表で見る</summary>
            <table className="mt-2 w-full">
              <tbody className="divide-y divide-slate-100">
                {[...data].reverse().map((p) => (
                  <tr key={p.id}>
                    <td className="py-1.5">{p.date.replaceAll("-", "/")}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">{formatTime(p.timeCs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// 月ごとの練習距離
// ---------------------------------------------------------------------

function MonthlyChart({ months }: { months: MonthPoint[] }) {
  const total = months.reduce((s, m) => s + m.distance, 0);
  const activeMonths = months.filter((m) => m.distance > 0).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="直近12か月の合計"
          value={`${(total / 1000).toFixed(1)}`}
          unit="km"
          icon={<SwimIcon className="h-7 w-7" />}
          tone="sky"
          deco="wave"
        />
        <StatCard
          label="月平均（練習した月）"
          value={activeMonths ? `${(total / activeMonths / 1000).toFixed(1)}` : "-"}
          unit={activeMonths ? "km" : ""}
          icon={<GaugeIcon className="h-7 w-7" />}
          tone="teal"
          deco="curve"
        />
      </div>

      <div className="card px-1 py-3">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={months} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => `${Number(m.slice(5))}月`}
              tick={{ fontSize: 11, fill: AXIS }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              interval={0}
            />
            <YAxis
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              tick={{ fontSize: 11, fill: AXIS }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.15)" }}
              formatter={(value, _name, item) => [
                `${Number(value).toLocaleString()} m（${(item.payload as MonthPoint).days}日）`,
                "距離",
              ]}
              labelFormatter={(m) => `${String(m).slice(0, 4)}年${Number(String(m).slice(5))}月`}
            />
            <Bar dataKey="distance" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="card text-sm">
        <summary className="cursor-pointer text-slate-600">表で見る</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="py-1 text-left font-normal">月</th>
              <th className="py-1 text-right font-normal">距離</th>
              <th className="py-1 text-right font-normal">日数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...months].reverse().map((m) => (
              <tr key={m.month}>
                <td className="py-1.5">{m.month.replace("-", "/")}</td>
                <td className="py-1.5 text-right tabular-nums">{m.distance.toLocaleString()} m</td>
                <td className="py-1.5 text-right tabular-nums">{m.days} 日</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

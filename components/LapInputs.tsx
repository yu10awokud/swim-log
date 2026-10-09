"use client";

import { digitsToCs, formatTime } from "@/lib/time";
import { LAP_DISTANCE, lapCount } from "@/lib/laps";
import TimeInput from "./TimeInput";

/**
 * 50m ごとのラップ入力（任意）。100m 以上・50 の倍数の距離のときだけ表示されます。
 * 最後のラップを空欄にしておくと、合計タイムから自動計算して保存します。
 */
export default function LapInputs(props: {
  distance: number;
  laps: string[];
  totalDigits: string;
  onChange: (laps: string[]) => void;
}) {
  const n = lapCount(props.distance);
  if (n === 0) return null;

  if (props.laps.length === 0) {
    return (
      <button
        type="button"
        className="text-sm font-semibold text-brand-700"
        onClick={() => props.onChange(Array<string>(n).fill(""))}
      >
        ＋ ラップを入力（任意）
      </button>
    );
  }

  const laps = Array.from({ length: n }, (_, i) => props.laps[i] ?? "");
  const lapCs = laps.map((d) => (d === "" ? null : digitsToCs(d)));
  const totalCs = props.totalDigits ? digitsToCs(props.totalDigits) : null;

  // 最後のラップが空欄なら、合計タイムからの自動計算値を薄く表示する
  const othersFilled = lapCs.slice(0, n - 1).every((v) => v !== null && v > 0);
  const autoLast =
    lapCs[n - 1] === null && othersFilled && totalCs
      ? totalCs - lapCs.slice(0, n - 1).reduce<number>((a, b) => a + (b ?? 0), 0)
      : null;

  const filledSum = lapCs.every((v) => v !== null) ? lapCs.reduce<number>((a, b) => a + (b ?? 0), 0) : null;
  const mismatch = filledSum !== null && totalCs !== null && filledSum !== totalCs;

  // 各地点の通過タイム（途中に空欄があれば、それ以降は出さない）
  const shown = lapCs.map((v, i) => v ?? (i === n - 1 ? autoLast : null));
  const passing: (number | null)[] = [];
  shown.forEach((v, i) => {
    const prev = i === 0 ? 0 : passing[i - 1];
    passing.push(v !== null && prev !== null ? prev + v : null);
  });

  return (
    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">ラップ（50mごと）</span>
        <button type="button" className="text-xs text-red-500" onClick={() => props.onChange([])}>
          ラップを消す
        </button>
      </div>
      {laps.map((digits, i) => {
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right text-xs text-slate-500">{(i + 1) * LAP_DISTANCE}m</span>
            <TimeInput
              digits={digits}
              onChange={(d) => props.onChange(laps.map((x, j) => (j === i ? d : x)))}
              className="w-28 py-1.5"
            />
            <span className="text-xs tabular-nums text-slate-400">
              {i === n - 1 && digits === "" && autoLast !== null && autoLast > 0
                ? `自動 ${formatTime(autoLast)}`
                : passing[i] !== null
                  ? `通過 ${formatTime(passing[i]!)}`
                  : ""}
            </span>
          </div>
        );
      })}
      {mismatch && (
        <p className="text-xs text-amber-600">
          ラップの合計（{formatTime(filledSum!)}）がタイム（{formatTime(totalCs!)}）と一致しません。
        </p>
      )}
    </div>
  );
}

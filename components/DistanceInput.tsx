"use client";

import { DISTANCE_PRESETS } from "@/lib/types";

/** 距離の入力欄。よく使う距離はボタンで選べます。 */
export default function DistanceInput(props: { value: string; onChange: (value: string) => void; id?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <input
          id={props.id}
          type="text"
          inputMode="numeric"
          className="input w-24 text-right tabular-nums"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="100"
        />
        <span className="text-sm text-slate-500">m</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {DISTANCE_PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => props.onChange(String(d))}
            className={`chip rounded-full px-2.5 py-1 text-xs ${props.value === String(d) ? "chip-active" : ""}`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

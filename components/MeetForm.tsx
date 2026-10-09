"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { uuid } from "@/lib/uuid";
import { csToDigits, digitsToCs } from "@/lib/time";
import { COURSE_LABEL, strokeLabel, type Course, type Meet, type MeetResult, type Stroke } from "@/lib/types";
import { saveMeet } from "@/app/(app)/meets/actions";
import TimeInput from "./TimeInput";
import DistanceInput from "./DistanceInput";
import LapInputs from "./LapInputs";
import { fitLaps, lapsToCs } from "@/lib/laps";

type ResultRow = { key: string; strokeId: string; distance: string; digits: string; note: string; laps: string[] };

const newKey = () => uuid();

/** 試合記録の入力フォーム（新規・編集共通） */
export default function MeetForm(props: {
  strokes: Stroke[];
  defaultDate: string;
  initial?: Meet & { results: MeetResult[] };
}) {
  const router = useRouter();
  const { initial, strokes } = props;

  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.meet_date ?? props.defaultDate);
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [course, setCourse] = useState<Course>(initial?.course ?? "LC");
  const [rows, setRows] = useState<ResultRow[]>(() =>
    initial
      ? initial.results.map((r) => ({
          key: newKey(),
          strokeId: r.stroke_id,
          distance: String(r.distance),
          digits: csToDigits(r.time_cs),
          note: r.note,
          laps: (r.laps_cs ?? []).map((v) => (v ? csToDigits(v) : "")),
        }))
      : [{ key: newKey(), strokeId: strokes[0]?.id ?? "", distance: "100", digits: "", note: "", laps: [] }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (strokes.length === 0) {
    return (
      <div className="card space-y-2 text-sm">
        <p>試合記録を入力する前に、種目を登録してください。</p>
        <Link href="/masters" className="btn-primary">
          マスタ管理へ
        </Link>
      </div>
    );
  }

  const updateRow = (key: string, patch: Partial<ResultRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const results = [];
    for (const [i, row] of rows.entries()) {
      const cs = digitsToCs(row.digits);
      const distance = Number(row.distance);
      if (!row.digits || cs === null || cs <= 0) return setError(`結果 ${i + 1} 行目のタイムが正しくありません。`);
      if (!distance) return setError(`結果 ${i + 1} 行目の距離を入力してください。`);
      const laps = lapsToCs(row.laps, distance, cs);
      if (typeof laps === "string") return setError(`結果 ${i + 1} 行目：${laps}`);
      results.push({ stroke_id: row.strokeId, distance, time_cs: cs, note: row.note, laps_cs: laps });
    }

    setSaving(true);
    const result = await saveMeet({ id: initial?.id ?? null, name, meet_date: date, venue, course, results });
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push("/meets");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="card space-y-4">
        <div>
          <label htmlFor="name" className="label">
            大会名
          </label>
          <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="〇〇選手権" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className="label">
              日付
            </label>
            <input id="date" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <span className="label">水路</span>
            <div className="toggle">
              {(["SC", "LC"] as Course[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourse(c)}
                  className={`toggle-item flex-1 ${course === c ? "toggle-item-active" : ""}`}
                >
                  {COURSE_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="venue" className="label">
            会場
          </label>
          <input id="venue" className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="〇〇プール" />
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">結果</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setRows((rs) => [
                ...rs,
                {
                  key: newKey(),
                  strokeId: rs[rs.length - 1]?.strokeId ?? strokes[0].id,
                  distance: rs[rs.length - 1]?.distance ?? "100",
                  digits: "",
                  note: "",
                  laps: [],
                },
              ])
            }
          >
            ＋ 結果を追加
          </button>
        </div>
        {rows.map((row, i) => (
          <div key={row.key} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">#{i + 1}</span>
              <button type="button" className="text-sm text-red-500" onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
                削除
              </button>
            </div>
            <select className="input" value={row.strokeId} onChange={(e) => updateRow(row.key, { strokeId: e.target.value })} aria-label="種目">
              {strokes.map((s) => (
                <option key={s.id} value={s.id}>
                  {strokeLabel(s)}
                </option>
              ))}
            </select>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <DistanceInput
                  value={row.distance}
                  onChange={(v) => updateRow(row.key, { distance: v, laps: fitLaps(row.laps, Number(v)) })}
                />
              </div>
              <div className="w-32">
                <TimeInput digits={row.digits} onChange={(d) => updateRow(row.key, { digits: d })} />
              </div>
            </div>
            <LapInputs
              distance={Number(row.distance)}
              laps={row.laps}
              totalDigits={row.digits}
              onChange={(laps) => updateRow(row.key, { laps })}
            />
            <input
              className="input"
              placeholder="備考（予選・決勝など）"
              value={row.note}
              onChange={(e) => updateRow(row.key, { note: e.target.value })}
              aria-label="備考"
            />
          </div>
        ))}
      </section>

      {error && <p className="error-box">{error}</p>}

      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <button type="submit" className="btn-primary w-full py-2.5 text-sm" disabled={saving}>
          {saving ? "保存中…" : "保存する"}
        </button>
      </div>
    </form>
  );
}

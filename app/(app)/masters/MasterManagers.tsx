"use client";

import { useState, useTransition } from "react";
import { COURSE_LABEL, type ActionResult, type Course, type Pool, type Stroke } from "@/lib/types";
import { deleteMaster, moveMaster, savePool, saveStroke } from "./actions";

/** 一覧の 1 行分の操作ボタン（▲▼・編集・削除）と、エラー表示をまとめたフック */
function useRowActions() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onSuccess?.();
      else setError(result.error);
    });
  }
  return { pending, error, run };
}

function RowButtons(props: {
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        className="h-9 w-9 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        disabled={props.disabled || props.isFirst}
        onClick={() => props.onMove(-1)}
        aria-label="上へ"
      >
        ▲
      </button>
      <button
        type="button"
        className="h-9 w-9 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        disabled={props.disabled || props.isLast}
        onClick={() => props.onMove(1)}
        aria-label="下へ"
      >
        ▼
      </button>
      <button type="button" className="btn-secondary px-3" disabled={props.disabled} onClick={props.onEdit}>
        編集
      </button>
      <button type="button" className="btn-danger px-3" disabled={props.disabled} onClick={props.onDelete}>
        削除
      </button>
    </div>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mt-2 error-box">{error}</p>;
}

// ---------------------------------------------------------------------
// 種目
// ---------------------------------------------------------------------

function StrokeForm(props: { initial?: Stroke; onDone: () => void; onCancel?: () => void }) {
  const [code, setCode] = useState(props.initial?.code ?? "");
  const [name, setName] = useState(props.initial?.name ?? "");
  const { pending, error, run } = useRowActions();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => saveStroke(props.initial?.id ?? null, { code, name }),
          () => {
            if (!props.initial) {
              setCode("");
              setName("");
            }
            props.onDone();
          },
        );
      }}
    >
      <div className="flex gap-2">
        <input className="input w-24" placeholder="Fr" value={code} onChange={(e) => setCode(e.target.value)} aria-label="略称" />
        <input className="input flex-1" placeholder="自由形" value={name} onChange={(e) => setName(e.target.value)} aria-label="名前" />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        {props.onCancel && (
          <button type="button" className="btn-secondary" onClick={props.onCancel}>
            キャンセル
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={pending}>
          {props.initial ? "保存" : "追加"}
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function StrokeManager({ strokes }: { strokes: Stroke[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { pending, error, run } = useRowActions();

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="section-title mb-2">種目を追加</h2>
        <p className="mb-2 text-xs text-slate-500">略称（Fr など）と名前（自由形 など）を入力します。</p>
        <StrokeForm onDone={() => {}} />
      </div>

      <ErrorText error={error} />
      <ul className="card divide-y divide-slate-100 p-0">
        {strokes.length === 0 && <li className="p-4 text-sm text-slate-500">種目がまだありません。</li>}
        {strokes.map((stroke, i) => (
          <li key={stroke.id} className="p-3">
            {editingId === stroke.id ? (
              <StrokeForm initial={stroke} onDone={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-bold text-navy-900">{stroke.code}</span>
                  <span className="ml-2 text-slate-600">{stroke.name}</span>
                </div>
                <RowButtons
                  isFirst={i === 0}
                  isLast={i === strokes.length - 1}
                  disabled={pending}
                  onMove={(d) => run(() => moveMaster("strokes", stroke.id, d))}
                  onEdit={() => setEditingId(stroke.id)}
                  onDelete={() => {
                    if (confirm(`種目「${stroke.code}」を削除しますか？`)) run(() => deleteMaster("strokes", stroke.id));
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------
// プール
// ---------------------------------------------------------------------

function CourseSelect({ value, onChange }: { value: Course; onChange: (c: Course) => void }) {
  return (
    <div className="toggle shrink-0">
      {(["SC", "LC"] as Course[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`toggle-item ${value === c ? "toggle-item-active" : ""}`}
        >
          {COURSE_LABEL[c]}
        </button>
      ))}
    </div>
  );
}

function PoolForm(props: { initial?: Pool; onDone: () => void; onCancel?: () => void }) {
  const [name, setName] = useState(props.initial?.name ?? "");
  const [course, setCourse] = useState<Course>(props.initial?.course ?? "SC");
  const { pending, error, run } = useRowActions();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => savePool(props.initial?.id ?? null, { name, course }),
          () => {
            if (!props.initial) setName("");
            props.onDone();
          },
        );
      }}
    >
      <div className="flex flex-wrap gap-2">
        <input className="input min-w-0 flex-1" placeholder="踏水会" value={name} onChange={(e) => setName(e.target.value)} aria-label="プール名" />
        <CourseSelect value={course} onChange={setCourse} />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        {props.onCancel && (
          <button type="button" className="btn-secondary" onClick={props.onCancel}>
            キャンセル
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={pending}>
          {props.initial ? "保存" : "追加"}
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function PoolManager({ pools }: { pools: Pool[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { pending, error, run } = useRowActions();

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="section-title mb-2">プールを追加</h2>
        <PoolForm onDone={() => {}} />
      </div>

      <ErrorText error={error} />
      <ul className="card divide-y divide-slate-100 p-0">
        {pools.length === 0 && <li className="p-4 text-sm text-slate-500">プールがまだありません。</li>}
        {pools.map((pool, i) => (
          <li key={pool.id} className="p-3">
            {editingId === pool.id ? (
              <PoolForm initial={pool} onDone={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-bold text-navy-900">{pool.name}</div>
                  <span
                    className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs ${
                      pool.course === "SC" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {COURSE_LABEL[pool.course]}
                  </span>
                </div>
                <RowButtons
                  isFirst={i === 0}
                  isLast={i === pools.length - 1}
                  disabled={pending}
                  onMove={(d) => run(() => moveMaster("pools", pool.id, d))}
                  onEdit={() => setEditingId(pool.id)}
                  onDelete={() => {
                    if (confirm(`プール「${pool.name}」を削除しますか？`)) run(() => deleteMaster("pools", pool.id));
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uuid } from "@/lib/uuid";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { digitsToCs, csToDigits } from "@/lib/time";
import { poolLabel, strokeLabel, TIME_FORMATS, type Pool, type Stroke, type TimeFormat } from "@/lib/types";
import { savePractice } from "@/app/(app)/practices/actions";
import TimeInput from "./TimeInput";
import DistanceInput from "./DistanceInput";

const IMAGE_BUCKET = "practice-images";

type TimeRow = { key: string; format: TimeFormat; strokeId: string; distance: string; digits: string };
type ExistingImage = { id: string; url: string };
type NewImage = { key: string; file: File; preview: string };

export type PracticeFormInitial = {
  id: string;
  practice_date: string;
  pool_id: string;
  total_distance: number;
  memo: string;
  times: { format: TimeFormat; stroke_id: string; distance: number; time_cs: number }[];
  images: ExistingImage[];
};

const newKey = () => uuid();

/** 練習記録の入力フォーム（新規・編集共通） */
export default function PracticeForm(props: {
  userId: string;
  strokes: Stroke[];
  pools: Pool[];
  defaultDate: string;
  initial?: PracticeFormInitial;
}) {
  const router = useRouter();
  const { initial, strokes, pools } = props;

  // 新規のときは、ここで練習の ID を決めておく（画像の保存先フォルダ名に使うため）
  const [practiceId] = useState(() => initial?.id ?? uuid());
  const [date, setDate] = useState(initial?.practice_date ?? props.defaultDate);
  const [poolId, setPoolId] = useState(initial?.pool_id ?? pools[0]?.id ?? "");
  const [totalDistance, setTotalDistance] = useState(initial ? String(initial.total_distance) : "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [times, setTimes] = useState<TimeRow[]>(
    () =>
      initial?.times.map((t) => ({
        key: newKey(),
        format: t.format,
        strokeId: t.stroke_id,
        distance: String(t.distance),
        digits: csToDigits(t.time_cs),
      })) ?? [],
  );
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(initial?.images ?? []);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // プレビュー用の一時 URL を、画面を離れるときに解放する
  const newImagesRef = useRef(newImages);
  newImagesRef.current = newImages;
  useEffect(() => () => newImagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview)), []);

  if (pools.length === 0 || strokes.length === 0) {
    return (
      <div className="card space-y-2 text-sm">
        <p>記録を入力する前に、プールと種目を登録してください。</p>
        <Link href={pools.length === 0 ? "/masters?tab=pools" : "/masters"} className="btn-primary">
          マスタ管理へ
        </Link>
      </div>
    );
  }

  const updateTime = (key: string, patch: Partial<TimeRow>) =>
    setTimes((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const addTime = () =>
    setTimes((rows) => {
      // 直前の行の形式・種目・距離を引き継ぐと、同じ種目を続けて入れるときに楽
      const last = rows[rows.length - 1];
      return [
        ...rows,
        {
          key: newKey(),
          format: last?.format ?? "TT",
          strokeId: last?.strokeId ?? strokes[0].id,
          distance: last?.distance ?? "100",
          digits: "",
        },
      ];
    });

  function onPickFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ key: newKey(), file, preview: URL.createObjectURL(file) }));
    setNewImages((imgs) => [...imgs, ...picked]);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 入力チェック（細かいチェックはサーバー側でも行います）
    const timePayload = [];
    for (const [i, row] of times.entries()) {
      const cs = digitsToCs(row.digits);
      const distance = Number(row.distance);
      if (!row.digits || cs === null || cs <= 0) return setError(`タイム ${i + 1} 行目のタイムが正しくありません。`);
      if (!distance) return setError(`タイム ${i + 1} 行目の距離を入力してください。`);
      timePayload.push({ format: row.format, stroke_id: row.strokeId, distance, time_cs: cs });
    }

    const supabase = createClient();
    const uploadedPaths: string[] = [];

    try {
      // 1. 画像を縮小して Storage へアップロード
      for (const [i, img] of newImages.entries()) {
        setStatus(`画像をアップロード中… (${i + 1}/${newImages.length})`);
        const compressed = await imageCompression(img.file, {
          maxWidthOrHeight: 1600,
          maxSizeMB: 0.4,
          fileType: "image/jpeg",
          initialQuality: 0.8,
          useWebWorker: true,
        });
        const path = `${props.userId}/${practiceId}/${uuid()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) throw new Error("画像のアップロードに失敗しました。");
        uploadedPaths.push(path);
      }

      // 2. 記録を保存
      setStatus("保存中…");
      const result = await savePractice({
        id: practiceId,
        practice_date: date,
        pool_id: poolId,
        total_distance: Number(totalDistance || 0),
        memo,
        times: timePayload,
        new_image_paths: uploadedPaths,
        removed_image_ids: removedImageIds,
      });
      if (!result.ok) throw new Error(result.error);

      router.push(`/day/${date}`);
      router.refresh();
    } catch (err) {
      // 保存に失敗したら、今回アップロードした画像は消しておく
      if (uploadedPaths.length > 0) await supabase.storage.from(IMAGE_BUCKET).remove(uploadedPaths);
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
      setStatus(null);
    }
  }

  const busy = status !== null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 基本情報 */}
      <section className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className="label">
              日付
            </label>
            <input id="date" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="total" className="label">
              総距離
            </label>
            <div className="flex items-center gap-1">
              <input
                id="total"
                type="text"
                inputMode="numeric"
                className="input text-right tabular-nums"
                placeholder="5000"
                value={totalDistance}
                onChange={(e) => setTotalDistance(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <span className="text-sm text-slate-500">m</span>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="pool" className="label">
            プール
          </label>
          <select id="pool" className="input" value={poolId} onChange={(e) => setPoolId(e.target.value)}>
            {pools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {poolLabel(pool)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="memo" className="label">
            練習メモ
          </label>
          <textarea
            id="memo"
            rows={4}
            className="input"
            placeholder="メニューの内容や感想など"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </section>

      {/* 画像 */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">練習メニューの画像</h2>
          <button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()}>
            ＋ 画像を追加
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />
        </div>
        {existingImages.length + newImages.length === 0 ? (
          <p className="text-sm text-slate-400">ホワイトボードの写真などを添付できます（複数枚OK）。</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingImages.map((img) => (
              <Thumb
                key={img.id}
                src={img.url}
                onRemove={() => {
                  setExistingImages((imgs) => imgs.filter((x) => x.id !== img.id));
                  setRemovedImageIds((ids) => [...ids, img.id]);
                }}
              />
            ))}
            {newImages.map((img) => (
              <Thumb
                key={img.key}
                src={img.preview}
                isNew
                onRemove={() => {
                  URL.revokeObjectURL(img.preview);
                  setNewImages((imgs) => imgs.filter((x) => x.key !== img.key));
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* タイム */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">タイム</h2>
          <button type="button" className="btn-secondary" onClick={addTime}>
            ＋ タイムを追加
          </button>
        </div>
        {times.length === 0 && <p className="text-sm text-slate-400">分析グラフに反映されるのは「TT」のタイムだけです。</p>}
        {times.map((row, i) => (
          <div key={row.key} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">#{i + 1}</span>
              <button
                type="button"
                className="text-sm text-red-500"
                onClick={() => setTimes((rows) => rows.filter((r) => r.key !== row.key))}
              >
                削除
              </button>
            </div>
            <div className="flex gap-1">
              {TIME_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => updateTime(row.key, { format: f })}
                  className={`flex-1 rounded-md border py-1.5 text-sm ${
                    row.format === f
                      ? "border-brand-600 bg-brand-600 font-semibold text-white"
                      : "border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <select
              className="input"
              value={row.strokeId}
              onChange={(e) => updateTime(row.key, { strokeId: e.target.value })}
              aria-label="種目"
            >
              {strokes.map((s) => (
                <option key={s.id} value={s.id}>
                  {strokeLabel(s)}
                </option>
              ))}
            </select>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <DistanceInput value={row.distance} onChange={(v) => updateTime(row.key, { distance: v })} />
              </div>
              <div className="w-32">
                <TimeInput digits={row.digits} onChange={(d) => updateTime(row.key, { digits: d })} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* 保存ボタン（スマホでは画面下に固定） */}
      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={busy}>
          {status ?? "保存する"}
        </button>
      </div>
    </form>
  );
}

function Thumb({ src, onRemove, isNew }: { src: string; onRemove: () => void; isNew?: boolean }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {isNew && <span className="absolute bottom-1 left-1 rounded bg-brand-600 px-1 text-[10px] text-white">新規</span>}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 h-7 w-7 rounded-full bg-black/60 text-sm text-white"
        aria-label="画像を外す"
      >
        ✕
      </button>
    </div>
  );
}

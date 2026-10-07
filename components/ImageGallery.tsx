"use client";

import { useEffect, useRef, useState } from "react";

export type GalleryImage = { id: string; url: string };

/** サムネイル一覧。タップすると全画面で表示し、左右スワイプ（またはボタン）で切り替えます。 */
export default function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const isOpen = openIndex !== null;
  const count = images.length;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + count) % count));
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % count));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, count]);

  if (count === 0) return null;

  const go = (step: number) => setOpenIndex((i) => (i === null ? i : (i + step + count) % count));

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={`練習メニュー ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onTouchStart={(e) => {
            touchStartX.current = e.touches.length === 1 ? e.touches[0].clientX : null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
            touchStartX.current = null;
          }}
        >
          <div className="flex items-center justify-between p-2 text-white">
            <span className="px-2 text-sm">
              {openIndex + 1} / {count}
            </span>
            <div className="flex items-center gap-1">
              <a
                href={images[openIndex].url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-3 py-2 text-sm hover:bg-white/10"
              >
                原寸で開く
              </a>
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="h-11 w-11 rounded-lg text-2xl hover:bg-white/10"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[openIndex].url}
              alt={`練習メニュー ${openIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-1 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white"
                  aria-label="前の画像"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-1 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white"
                  aria-label="次の画像"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarIcon,
  ChartIcon,
  ChevronRight,
  CloseIcon,
  FlagIcon,
  GearIcon,
  MenuIcon,
  PencilIcon,
  TrophyIcon,
  WaveLogo,
} from "./Icons";

const NAV_ITEMS = [
  { href: "/calendar", match: ["/calendar", "/day"], label: "カレンダー", Icon: CalendarIcon },
  { href: "/practices/new", match: ["/practices"], label: "記録入力", Icon: PencilIcon },
  { href: "/analysis", match: ["/analysis"], label: "分析", Icon: ChartIcon },
  { href: "/meets", match: ["/meets"], label: "試合記録", Icon: FlagIcon },
  { href: "/bests", match: ["/bests"], label: "ベスト", Icon: TrophyIcon },
  { href: "/masters", match: ["/masters"], label: "マスタ管理", Icon: GearIcon },
];

/** サイドバー下部の波模様 */
function SidebarWaves() {
  return (
    <svg
      viewBox="0 0 300 220"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full"
      aria-hidden
    >
      <path d="M0 90c60-40 120-40 180 0s90 30 120 10v120H0z" fill="#ffffff" fillOpacity=".04" />
      <path d="M0 130c70-45 140-35 200 5s70 20 100 0v85H0z" fill="#ffffff" fillOpacity=".05" />
      <path d="M0 170c80-35 150-25 210 5s60 15 90 0v45H0z" fill="#ffffff" fillOpacity=".06" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="flex flex-col items-center px-5 pb-5 pt-7 text-center">
      <WaveLogo className="h-7 w-11" />
      <div className="mt-1 text-lg font-bold text-white">Swim Log</div>
      <div className="mt-0.5 text-[10px] text-sky-100/50">泳いだ日々を、もっと楽しく</div>
    </div>
  );
}

/** 左サイドバー（PC）／ハンバーガーメニュー（スマホ）付きの共通レイアウト */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 画面を移動したらメニューを閉じる
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (item: (typeof NAV_ITEMS)[number]) => item.match.some((m) => pathname.startsWith(m));
  const current = NAV_ITEMS.find(isActive);

  const nav = (
    <nav className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-navy-700 to-navy-900">
      <Logo />
      <ul className="relative z-10 flex-1 space-y-1.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white/[0.12] text-white"
                    : "text-sky-50/80 hover:bg-white/[0.06]"
                }`}
              >
                <item.Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4" />}
              </Link>
            </li>
          );
        })}
      </ul>
      <SidebarWaves />
    </nav>
  );

  return (
    <div className="min-h-dvh lg:flex">
      {/* PC：常に表示するサイドバー */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">{nav}</div>
      </aside>

      {/* スマホ：上部バー＋スライドメニュー */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-navy-700 px-2 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="メニューを開く"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <WaveLogo className="h-6 w-9" />
        <span className="text-sm">{current?.label ?? "Swim Log"}</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-900/50"
            onClick={() => setOpen(false)}
            aria-label="メニューを閉じる"
          />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            {nav}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10"
              aria-label="メニューを閉じる"
            >
              <CloseIcon />
            </button>
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-24 pt-4 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/calendar", label: "カレンダー", icon: "📅" },
  { href: "/practices/new", label: "記録入力", icon: "✏️" },
  { href: "/analysis", label: "分析", icon: "📈" },
  { href: "/meets", label: "試合記録", icon: "🏁" },
  { href: "/bests", label: "ベスト", icon: "🏆" },
  { href: "/masters", label: "マスタ管理", icon: "⚙️" },
];

/** 左サイドバー（PC）／ハンバーガーメニュー（スマホ）付きの共通レイアウト */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 画面を移動したらメニューを閉じる
  useEffect(() => setOpen(false), [pathname]);

  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.href));

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="px-5 py-5 text-xl font-bold text-brand-700">Swim Log</div>
      <ul className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base ${
                  active ? "bg-brand-100 font-semibold text-brand-800" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={logout} className="border-t border-slate-200 p-3">
        <button type="submit" className="w-full rounded-lg px-3 py-3 text-left text-slate-500 hover:bg-slate-100">
          ログアウト
        </button>
      </form>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:flex">
      {/* PC：常に表示するサイドバー */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-dvh">{nav}</div>
      </aside>

      {/* スマホ：上部バー＋スライドメニュー */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-2 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-slate-700 hover:bg-slate-100"
          aria-label="メニューを開く"
        >
          ☰
        </button>
        <span className="font-semibold text-slate-700">{current?.label ?? "Swim Log"}</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="メニューを閉じる"
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">{nav}</aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 lg:pt-8">{children}</main>
    </div>
  );
}

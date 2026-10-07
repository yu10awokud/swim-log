import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import type { Pool, Stroke } from "@/lib/types";
import { PoolManager, StrokeManager } from "./MasterManagers";

export default async function MastersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "pools" ? "pools" : "strokes";
  const { supabase } = await requireUser();

  const [{ data: strokes }, { data: pools }] = await Promise.all([
    supabase.from("strokes").select("id, code, name, sort_order").order("sort_order").order("created_at"),
    supabase.from("pools").select("id, name, course, sort_order").order("sort_order").order("created_at"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="page-title">マスタ管理</h1>

      <div className="flex rounded-lg bg-slate-200 p-1 text-sm font-semibold">
        {[
          { key: "strokes", label: "種目" },
          { key: "pools", label: "プール" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/masters?tab=${t.key}`}
            replace
            className={`flex-1 rounded-md py-2 text-center ${
              activeTab === t.key ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "strokes" ? (
        <StrokeManager strokes={(strokes ?? []) as Stroke[]} />
      ) : (
        <PoolManager pools={(pools ?? []) as Pool[]} />
      )}
    </div>
  );
}

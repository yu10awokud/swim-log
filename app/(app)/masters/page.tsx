import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import { PoolManager, StrokeManager } from "./MasterManagers";

export default async function MastersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "pools" ? "pools" : "strokes";
  const supabase = getSupabase();

  const { strokes, pools, loadError } = await fetchMasters(supabase);

  return (
    <div className="space-y-4">
      <h1 className="page-title">マスタ管理</h1>
      {loadError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>}

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
        <StrokeManager strokes={strokes} />
      ) : (
        <PoolManager pools={pools} />
      )}
    </div>
  );
}

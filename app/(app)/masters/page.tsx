import Link from "next/link";
import { GearIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import { PoolManager, StrokeManager } from "./MasterManagers";

export default async function MastersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "pools" ? "pools" : "strokes";
  const supabase = getSupabase();

  const { strokes, pools, loadError } = await fetchMasters(supabase);

  return (
    <div className="panel space-y-4">
      <PageHeader icon={<GearIcon className="h-6 w-6" />} title="マスタ管理" subtitle="種目とプールの登録" />
      {loadError && <p className="error-box">{loadError}</p>}

      <div className="seg">
        {[
          { key: "strokes", label: "種目" },
          { key: "pools", label: "プール" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/masters?tab=${t.key}`}
            replace
            className={`seg-item ${activeTab === t.key ? "seg-item-active" : ""}`}
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

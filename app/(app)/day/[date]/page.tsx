import Link from "next/link";
import { PlusIcon, SwimIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";
import { getSupabase } from "@/lib/supabase/server";
import { signedUrlMap } from "@/lib/images";
import { formatDateJa, isValidDate } from "@/lib/date";
import { formatTime } from "@/lib/time";
import { poolLabel, type Course } from "@/lib/types";
import DeletePracticeButton from "./DeletePracticeButton";
import LapText from "@/components/LapText";

const FORMAT_STYLE: Record<string, string> = {
  TT: "bg-amber-100 text-amber-800",
  Short: "bg-emerald-100 text-emerald-800",
  Middle: "bg-violet-100 text-violet-800",
};

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isValidDate(date)) notFound();
  const supabase = getSupabase();

  const { data } = await supabase
    .from("practices")
    .select(
      `id, total_distance, memo, created_at,
       pools(name, course),
       time_records(*, strokes(code)),
       practice_images(id, storage_path, sort_order)`,
    )
    .eq("practice_date", date)
    .order("created_at");

  // Supabase の型推論では結合先が配列になることがあるため、ここで形を整える
  const practices = (data ?? []).map((p) => ({
    ...p,
    pool: (Array.isArray(p.pools) ? p.pools[0] : p.pools) as { name: string; course: Course } | null,
    times: [...p.time_records]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({ ...t, stroke: (Array.isArray(t.strokes) ? t.strokes[0] : t.strokes) as { code: string } | null })),
    images: [...p.practice_images].sort((a, b) => a.sort_order - b.sort_order),
  }));

  const urls = await signedUrlMap(
    supabase,
    practices.flatMap((p) => p.images.map((img) => img.storage_path)),
  );
  const total = practices.reduce((sum, p) => sum + p.total_distance, 0);

  return (
    <div className="panel space-y-4">
      <PageHeader
        back={{ href: `/calendar?month=${date.slice(0, 7)}`, label: "カレンダーへ" }}
        icon={<SwimIcon className="h-6 w-6" />}
        title={formatDateJa(date)}
        subtitle={practices.length > 0 ? `合計 ${total.toLocaleString()} m` : undefined}
      />

      <Link href={`/practices/new?date=${date}`} className="btn-primary w-full py-3.5 text-base">
        <PlusIcon /> この日に記録を追加
      </Link>

      {practices.length === 0 && <p className="card text-sm text-slate-500">この日の記録はありません。</p>}

      {practices.map((p) => (
        <article key={p.id} className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-3xl font-medium tabular-nums text-navy-900">
                {p.total_distance.toLocaleString()}
                <span className="ml-0.5 text-sm font-normal text-slate-500">m</span>
              </div>
              <div className="text-sm text-slate-600">{p.pool ? poolLabel(p.pool) : "（プール未設定）"}</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/practices/${p.id}/edit`} className="btn-secondary">
                編集
              </Link>
              <DeletePracticeButton id={p.id} />
            </div>
          </div>

          {p.memo && <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{p.memo}</p>}

          {p.times.length > 0 && (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {p.times.map((t) => (
                  <tr key={t.id}>
                    <td className="py-1.5 pr-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${FORMAT_STYLE[t.format] ?? ""}`}>
                        {t.format}
                      </span>
                    </td>
                    <td className="py-1.5">
                      {t.stroke?.code} {t.distance}m
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {formatTime(t.time_cs)}
                      <LapText laps={t.laps_cs} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <ImageGallery images={p.images.map((img) => ({ id: img.id, url: urls.get(img.storage_path) ?? "" }))} />
        </article>
      ))}
    </div>
  );
}

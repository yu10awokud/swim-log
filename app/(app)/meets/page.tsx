import Link from "next/link";
import { FlagIcon, PlusIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase/server";
import { formatTime } from "@/lib/time";
import { COURSE_LABEL, type Course } from "@/lib/types";
import DeleteMeetButton from "./DeleteMeetButton";
import LapText from "@/components/LapText";

export default async function MeetsPage() {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("meets")
    .select("id, name, meet_date, venue, course, meet_results(*, strokes(code))")
    .order("meet_date", { ascending: false })
    .order("created_at", { ascending: false });

  const meets = (data ?? []).map((m) => ({
    ...m,
    course: m.course as Course,
    results: [...m.meet_results]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => ({ ...r, stroke: (Array.isArray(r.strokes) ? r.strokes[0] : r.strokes) as { code: string } | null })),
  }));

  return (
    <div className="panel space-y-4">
      <PageHeader
        icon={<FlagIcon className="h-6 w-6" />}
        title="試合記録"
        action={
          <Link href="/meets/new" className="btn-primary">
            <PlusIcon className="h-4 w-4" /> 追加
          </Link>
        }
      />

      {meets.length === 0 && <p className="card text-sm text-slate-500">試合記録がまだありません。</p>}

      {meets.map((meet) => (
        <article key={meet.id} id={`meet-${meet.id}`} className="card scroll-mt-20 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">{meet.meet_date.replaceAll("-", "/")}</div>
              <h2 className="section-title">{meet.name}</h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                {meet.venue && <span>{meet.venue}</span>}
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    meet.course === "SC" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {COURSE_LABEL[meet.course]}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/meets/${meet.id}/edit`} className="btn-secondary">
                編集
              </Link>
              <DeleteMeetButton id={meet.id} name={meet.name} />
            </div>
          </div>
          {meet.results.length > 0 && (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {meet.results.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5">
                      {r.stroke?.code} {r.distance}m
                    </td>
                    <td className="py-1.5 text-xs text-slate-500">{r.note}</td>
                    <td className="py-1.5 text-right font-mono font-semibold tabular-nums">
                      {formatTime(r.time_cs)}
                      <LapText laps={r.laps_cs} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      ))}
    </div>
  );
}

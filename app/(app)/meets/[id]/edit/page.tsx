import Link from "next/link";
import { notFound } from "next/navigation";
import MeetForm from "@/components/MeetForm";
import { requireUser } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import type { Course, MeetResult } from "@/lib/types";

export default async function EditMeetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: meet } = await supabase
    .from("meets")
    .select("id, name, meet_date, venue, course, meet_results(id, stroke_id, distance, time_cs, note, sort_order)")
    .eq("id", id)
    .maybeSingle();
  if (!meet) notFound();

  const { strokes } = await fetchMasters(supabase);
  const results = ([...meet.meet_results] as MeetResult[]).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">試合記録を編集</h1>
        <Link href="/meets" className="text-sm text-brand-700">
          戻る
        </Link>
      </div>
      <MeetForm
        strokes={strokes}
        defaultDate={meet.meet_date}
        initial={{ id: meet.id, name: meet.name, meet_date: meet.meet_date, venue: meet.venue, course: meet.course as Course, results }}
      />
    </div>
  );
}

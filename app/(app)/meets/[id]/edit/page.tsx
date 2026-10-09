import { FlagIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { notFound } from "next/navigation";
import MeetForm from "@/components/MeetForm";
import { getSupabase } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import type { Course, MeetResult } from "@/lib/types";

export default async function EditMeetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: meet } = await supabase
    .from("meets")
    .select("id, name, meet_date, venue, course, meet_results(*)")
    .eq("id", id)
    .maybeSingle();
  if (!meet) notFound();

  const { strokes } = await fetchMasters(supabase);
  const results = ([...meet.meet_results] as MeetResult[]).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="panel space-y-4">
      <PageHeader back={{ href: "/meets", label: "試合記録へ" }} icon={<FlagIcon className="h-6 w-6" />} title="試合記録を編集" />
      <MeetForm
        strokes={strokes}
        defaultDate={meet.meet_date}
        initial={{ id: meet.id, name: meet.name, meet_date: meet.meet_date, venue: meet.venue, course: meet.course as Course, results }}
      />
    </div>
  );
}

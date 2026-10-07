import MeetForm from "@/components/MeetForm";
import { requireUser } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import { todayJST } from "@/lib/date";

export default async function NewMeetPage() {
  const { supabase } = await requireUser();
  const { strokes } = await fetchMasters(supabase);
  return (
    <div className="space-y-4">
      <h1 className="page-title">試合記録を追加</h1>
      <MeetForm strokes={strokes} defaultDate={todayJST()} />
    </div>
  );
}

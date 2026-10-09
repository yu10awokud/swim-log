import MeetForm from "@/components/MeetForm";
import { FlagIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import { todayJST } from "@/lib/date";

export default async function NewMeetPage() {
  const supabase = getSupabase();
  const { strokes } = await fetchMasters(supabase);
  return (
    <div className="panel space-y-4">
      <PageHeader back={{ href: "/meets", label: "試合記録へ" }} icon={<FlagIcon className="h-6 w-6" />} title="試合記録を追加" />
      <MeetForm strokes={strokes} defaultDate={todayJST()} />
    </div>
  );
}

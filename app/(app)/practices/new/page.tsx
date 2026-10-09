import PracticeForm from "@/components/PracticeForm";
import { PencilIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import { isValidDate, todayJST } from "@/lib/date";

export default async function NewPracticePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const supabase = getSupabase();
  const { strokes, pools } = await fetchMasters(supabase);

  return (
    <div className="panel space-y-4">
      <PageHeader icon={<PencilIcon className="h-6 w-6" />} title="記録入力" subtitle="練習の記録を残す" />
      <PracticeForm
        strokes={strokes}
        pools={pools}
        defaultDate={date && isValidDate(date) ? date : todayJST()}
      />
    </div>
  );
}

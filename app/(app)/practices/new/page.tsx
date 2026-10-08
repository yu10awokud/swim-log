import PracticeForm from "@/components/PracticeForm";
import { getSupabase } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import { isValidDate, todayJST } from "@/lib/date";

export default async function NewPracticePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const supabase = getSupabase();
  const { strokes, pools } = await fetchMasters(supabase);

  return (
    <div className="space-y-4">
      <h1 className="page-title">記録入力</h1>
      <PracticeForm
        strokes={strokes}
        pools={pools}
        defaultDate={date && isValidDate(date) ? date : todayJST()}
      />
    </div>
  );
}

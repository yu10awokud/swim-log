import { PencilIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { notFound } from "next/navigation";
import PracticeForm from "@/components/PracticeForm";
import { getSupabase } from "@/lib/supabase/server";
import { fetchMasters } from "@/lib/queries";
import { signedUrlMap } from "@/lib/images";
import type { TimeFormat } from "@/lib/types";

export default async function EditPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: practice } = await supabase
    .from("practices")
    .select(
      "id, practice_date, pool_id, total_distance, memo, time_records(*), practice_images(id, storage_path, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!practice) notFound();

  const { strokes, pools } = await fetchMasters(supabase);
  const images = [...practice.practice_images].sort((a, b) => a.sort_order - b.sort_order);
  const urls = await signedUrlMap(
    supabase,
    images.map((img) => img.storage_path),
  );

  return (
    <div className="panel space-y-4">
      <PageHeader
        back={{ href: `/day/${practice.practice_date}`, label: "戻る" }}
        icon={<PencilIcon className="h-6 w-6" />}
        title="記録を編集"
      />
      <PracticeForm
        strokes={strokes}
        pools={pools}
        defaultDate={practice.practice_date}
        initial={{
          id: practice.id,
          practice_date: practice.practice_date,
          pool_id: practice.pool_id,
          total_distance: practice.total_distance,
          memo: practice.memo,
          times: [...practice.time_records]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((t) => ({ ...t, format: t.format as TimeFormat })),
          images: images.map((img) => ({ id: img.id, url: urls.get(img.storage_path) ?? "" })),
        }}
      />
    </div>
  );
}

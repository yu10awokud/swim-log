"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteMeet } from "./actions";

export default function DeleteMeetButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-danger"
      disabled={pending}
      onClick={() => {
        if (!confirm(`「${name}」の記録を削除しますか？（結果もすべて削除されます）`)) return;
        startTransition(async () => {
          const result = await deleteMeet(id);
          if (!result.ok) alert(result.error);
          router.refresh();
        });
      }}
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}

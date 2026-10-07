"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePractice } from "@/app/(app)/practices/actions";

export default function DeletePracticeButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("この練習記録を削除しますか？（タイム・画像も削除されます）")) return;
        startTransition(async () => {
          const result = await deletePractice(id);
          if (!result.ok) alert(result.error);
          router.refresh();
        });
      }}
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}

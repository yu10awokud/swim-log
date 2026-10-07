import type { PostgrestError } from "@supabase/supabase-js";

/** データベースのエラーを、画面に出せる日本語メッセージに変換します。 */
export function dbErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case "23503":
      return "練習記録や試合記録で使用中のため削除できません。";
    case "23505":
      return "同じものがすでに登録されています。";
    case "23514":
      return "入力値が範囲外です。";
    default:
      console.error(error);
      return "保存に失敗しました。時間をおいてもう一度お試しください。";
  }
}

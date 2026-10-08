import type { PostgrestError } from "@supabase/supabase-js";

/** データベースのエラーを、原因と対処が分かる日本語メッセージに変換します。 */
export function dbErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case "23503":
      return "練習記録や試合記録で使用中のため削除できません。";
    case "23505":
      return "同じものがすでに登録されています。";
    case "23514":
      return "入力値が範囲外です。";
    case "23502":
      // 旧（ログインあり）版の user_id 列が残っていると、ここに来る
      return "データベースの設定が古いままです。Supabase の SQL Editor で supabase/migration_remove_auth.sql を実行してください。（23502）";
    case "42501":
      return "データベースへのアクセス権がありません。Vercel の環境変数 SUPABASE_SECRET_KEY に Secret key（sb_secret_...）が入っているか確認してください。（42501）";
    case "42P01":
    case "PGRST205":
      return "テーブルが見つかりません。Supabase の SQL Editor で supabase/schema.sql を実行してください。（" + error.code + "）";
    default:
      console.error(error);
      return `データベースでエラーが発生しました。（${error.code || "-"}: ${error.message}）`;
  }
}

import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/supabase/server";

// ログインが必要な画面はすべてこのフォルダ (app) の中に置きます。
// middleware でも確認していますが、念のためここでも未ログインならログイン画面へ戻します。
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <AppShell>{children}</AppShell>;
}

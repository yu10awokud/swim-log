import AppShell from "@/components/AppShell";

// 画面を開くたびに最新のデータを読み込む（ビルド時にページを作り置きしない）
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

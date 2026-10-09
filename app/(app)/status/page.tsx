import { getSupabase } from "@/lib/supabase/server";
import { GearIcon } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { SUPABASE_URL } from "@/lib/supabase/env";

// 設定の自己診断ページ（/status）。秘密の値そのものは表示しません。

type Check = { label: string; ok: boolean; detail: string };

/** キーの種類だけを判定します（値は表示しない）。 */
function keyKind(key: string | undefined): string {
  if (!key) return "未設定";
  if (key.startsWith("sb_secret_")) return "Secret key";
  if (key.startsWith("sb_publishable_")) return "Publishable key（※ここには Secret key が必要）";
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
      return payload.role === "service_role" ? "service_role キー（旧形式）" : `旧形式キー（role: ${payload.role}）※service_role が必要`;
    } catch {
      return "読み取れない形式";
    }
  }
  return "不明な形式";
}

export default async function StatusPage() {
  const checks: Check[] = [];
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  const kind = keyKind(secret);

  checks.push({
    label: "公開中のバージョン",
    ok: true,
    detail: (process.env.VERCEL_GIT_COMMIT_SHA ?? "ローカル").slice(0, 7),
  });
  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_URL",
    ok: /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(SUPABASE_URL),
    detail: SUPABASE_URL ? SUPABASE_URL.replace(/^https:\/\/([a-z0-9]{4})[a-z0-9]*/, "https://$1…") : "未設定",
  });
  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ok: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    detail: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "設定あり" : "未設定",
  });
  checks.push({
    label: "SUPABASE_SECRET_KEY の種類",
    ok: kind === "Secret key" || kind.startsWith("service_role"),
    detail: kind,
  });

  if (SUPABASE_URL && secret) {
    const supabase = getSupabase();

    const strokes = await supabase.from("strokes").select("id", { count: "exact", head: true });
    checks.push({
      label: "種目テーブルの読み込み",
      ok: !strokes.error,
      detail: strokes.error ? `${strokes.error.code}: ${strokes.error.message}` : `OK（${strokes.count} 件）`,
    });

    // 旧版の user_id 列が残っているか（残っていれば移行 SQL が未適用）
    const legacy = await supabase.from("pools").select("user_id").limit(1);
    checks.push({
      label: "移行 SQL（ログイン廃止）の適用",
      ok: !!legacy.error && legacy.error.code === "42703",
      detail: !legacy.error
        ? "未適用（user_id 列が残っています）"
        : legacy.error.code === "42703"
          ? "適用済み"
          : `確認できません（${legacy.error.code}: ${legacy.error.message}）`,
    });

    const bucket = await supabase.storage.getBucket("practice-images");
    checks.push({
      label: "画像バケット practice-images",
      ok: !bucket.error && bucket.data?.public === false,
      detail: bucket.error ? bucket.error.message : bucket.data?.public ? "公開になっています" : "OK（非公開）",
    });
  }

  return (
    <div className="panel space-y-4">
      <PageHeader icon={<GearIcon className="h-6 w-6" />} title="設定の診断" />
      <ul className="card divide-y divide-slate-100 p-0">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-3 p-3 text-sm">
            <span className={c.ok ? "text-emerald-600" : "text-red-600"}>{c.ok ? "✔" : "✖"}</span>
            <div className="min-w-0">
              <div className="font-semibold">{c.label}</div>
              <div className="break-all text-slate-600">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { ChevronLeft } from "./Icons";

/** 各画面の見出し（アイコン付き）。右側にボタンを置けます。 */
export default function PageHeader(props: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="space-y-2">
      {props.back && (
        <Link href={props.back.href} className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600">
          <ChevronLeft className="h-4 w-4" />
          {props.back.label}
        </Link>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {props.icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-brand-600 [&>svg]:h-5 [&>svg]:w-5">
              {props.icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="page-title truncate">{props.title}</h1>
            {props.subtitle && <p className="page-subtitle">{props.subtitle}</p>}
          </div>
        </div>
        {props.action && <div className="shrink-0">{props.action}</div>}
      </div>
    </div>
  );
}

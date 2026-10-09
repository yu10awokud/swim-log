// 数値のカード（合計距離・練習日数など）。デザイン用の飾り（波・棒・曲線）付き。

type Tone = "sky" | "indigo" | "teal" | "amber";
type Deco = "wave" | "bars" | "curve" | "none";

const TONES: Record<Tone, { badge: string; deco: string }> = {
  sky: { badge: "bg-sky-100 text-brand-600", deco: "#7dd3fc" },
  indigo: { badge: "bg-indigo-100 text-indigo-600", deco: "#a5b4fc" },
  teal: { badge: "bg-teal-50 text-teal-600", deco: "#67e8f9" },
  amber: { badge: "bg-amber-50 text-amber-600", deco: "#fcd34d" },
};

function Decoration({ kind, color }: { kind: Deco; color: string }) {
  if (kind === "none") return null;
  return (
    <svg viewBox="0 0 90 40" className="pointer-events-none absolute bottom-2 right-2 hidden h-8 w-20 opacity-40 xl:block" aria-hidden>
      {kind === "wave" && (
        <>
          <path d="M2 30c14-12 26-12 40-4s28 6 46-14" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d="M2 36c14-10 28-10 42-3s28 4 44-10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".5" />
        </>
      )}
      {kind === "bars" && (
        <>
          <rect x="44" y="24" width="10" height="14" rx="3" fill={color} opacity=".5" />
          <rect x="60" y="14" width="10" height="24" rx="3" fill={color} opacity=".7" />
          <rect x="76" y="4" width="10" height="34" rx="3" fill={color} />
        </>
      )}
      {kind === "curve" && (
        <>
          <path d="M2 34c20 0 30-4 46-14s26-14 40-14" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d="M2 34c20 0 30-4 46-14s26-14 40-14V40H2z" fill={color} opacity=".15" />
        </>
      )}
    </svg>
  );
}

export default function StatCard(props: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  deco?: Deco;
}) {
  const tone = TONES[props.tone ?? "sky"];
  return (
    <div className="card relative flex items-center gap-3 overflow-hidden p-3 sm:p-4">
      {props.icon && (
        <div className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full sm:flex md:h-14 md:w-14 ${tone.badge}`}>
          {props.icon}
        </div>
      )}
      <div className="relative z-10 min-w-0">
        <div className="text-xs text-slate-500">{props.label}</div>
        <div className="mt-0.5 whitespace-nowrap text-lg font-medium tabular-nums text-navy-900 sm:text-2xl md:text-3xl">
          {props.value}
          {props.unit && <span className="ml-0.5 text-xs sm:text-base">{props.unit}</span>}
        </div>
        {props.sub && <div className="text-xs text-slate-500">{props.sub}</div>}
      </div>
      <Decoration kind={props.deco ?? "none"} color={tone.deco} />
    </div>
  );
}

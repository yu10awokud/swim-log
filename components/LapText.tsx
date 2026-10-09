import { formatTime } from "@/lib/time";

/** ラップを「29.85 - 32.10」のように小さく表示します（ラップがなければ何も出さない）。 */
export default function LapText({ laps }: { laps?: (number | null)[] | null }) {
  if (!laps || laps.every((v) => v === null)) return null;
  return (
    <span className="block whitespace-normal text-[11px] font-normal text-slate-500">
      {laps.map((v) => (v === null ? "-" : formatTime(v))).join(" - ")}
    </span>
  );
}

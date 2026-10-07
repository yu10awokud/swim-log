"use client";

import { digitsToCs, formatDigits } from "@/lib/time";

/**
 * タイム入力欄。数字キーボードで数字だけを打つと、右から詰めて mm:ss.xx に整形されます。
 *   "3245" → 32.45、 "10532" → 1:05.32
 * 値は「数字だけの文字列」で親に渡します（保存時に digitsToCs で 1/100 秒に変換）。
 */
export default function TimeInput(props: {
  digits: string;
  onChange: (digits: string) => void;
  id?: string;
  className?: string;
}) {
  const invalid = props.digits !== "" && digitsToCs(props.digits) === null;

  return (
    <input
      id={props.id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="0:00.00"
      value={formatDigits(props.digits)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7);
        props.onChange(digits);
      }}
      onFocus={(e) => {
        // 常に末尾から入力されるよう、カーソルを最後へ
        const el = e.target;
        requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
      }}
      className={`input text-right font-mono tabular-nums ${invalid ? "border-red-400 bg-red-50" : ""} ${props.className ?? ""}`}
      aria-invalid={invalid}
    />
  );
}

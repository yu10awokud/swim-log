// タイムは 1/100 秒単位の整数（centiseconds, 略して cs）で扱います。
//   例：1:05.32 → 6532、 28.40 → 2840

/** 6532 → "1:05.32"、 2840 → "28.40" */
export function formatTime(cs: number): string {
  const minutes = Math.floor(cs / 6000);
  const seconds = Math.floor((cs % 6000) / 100);
  const hundredths = cs % 100;
  const ss = String(seconds).padStart(minutes > 0 ? 2 : 1, "0");
  const xx = String(hundredths).padStart(2, "0");
  return minutes > 0 ? `${minutes}:${ss}.${xx}` : `${ss}.${xx}`;
}

/**
 * 数字だけの文字列を右詰めで cs に変換します（タイム入力欄用）。
 *   "3" → 3（0.03）、 "3245" → 3245（32.45）、 "10532" → 6532（1:05.32）
 * 秒の部分が 60 以上のときは null（不正）を返します。
 */
export function digitsToCs(digits: string): number | null {
  if (!/^\d+$/.test(digits)) return null;
  const padded = digits.padStart(5, "0");
  const hundredths = Number(padded.slice(-2));
  const seconds = Number(padded.slice(-4, -2));
  const minutes = Number(padded.slice(0, -4));
  if (seconds >= 60) return null;
  return minutes * 6000 + seconds * 100 + hundredths;
}

/** cs → 入力欄用の数字列。 6532 → "10532" */
export function csToDigits(cs: number): string {
  const minutes = Math.floor(cs / 6000);
  const seconds = Math.floor((cs % 6000) / 100);
  const hundredths = cs % 100;
  const digits = `${minutes}${String(seconds).padStart(2, "0")}${String(hundredths).padStart(2, "0")}`;
  return digits.replace(/^0+/, "");
}

/** 入力途中の数字列をそのまま表示用に整形します。 "" → "", "3245" → "32.45" */
export function formatDigits(digits: string): string {
  if (digits === "") return "";
  const padded = digits.padStart(3, "0");
  const hundredths = padded.slice(-2);
  const rest = padded.slice(0, -2);
  if (rest.length <= 2) return `${Number(rest)}.${hundredths}`;
  const seconds = rest.slice(-2);
  const minutes = rest.slice(0, -2);
  return `${Number(minutes)}:${seconds}.${hundredths}`;
}

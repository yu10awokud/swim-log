import { digitsToCs } from "./time";

/** ラップは 50m ごと。100m 以上で 50 の倍数の距離だけラップを入力できます。 */
export const LAP_DISTANCE = 50;

/** その距離で入力できるラップの数（入力できない距離なら 0） */
export function lapCount(distance: number): number {
  if (!Number.isInteger(distance) || distance < 100 || distance % LAP_DISTANCE !== 0) return 0;
  return distance / LAP_DISTANCE;
}

/** 入力欄の数を距離に合わせる（足りなければ空欄を足し、多ければ切る） */
export function fitLaps(laps: string[], distance: number): string[] {
  const n = lapCount(distance);
  if (laps.length === 0 || n === 0) return laps;
  return Array.from({ length: n }, (_, i) => laps[i] ?? "");
}

/**
 * ラップ入力（数字列の配列）を保存用の 1/100 秒の配列に変換します。
 *   - ラップを使わない／すべて空欄なら null
 *   - 最後のラップだけ空欄で、合計タイムがあれば、最後のラップを自動計算
 *   - 空欄は null のまま保存（途中までのラップでもOK）
 * 不正な値があれば文字列でエラー内容を返します。
 */
export function lapsToCs(laps: string[], distance: number, totalCs: number | null): (number | null)[] | null | string {
  const n = lapCount(distance);
  if (n === 0 || laps.length === 0 || laps.every((d) => d === "")) return null;

  const values: (number | null)[] = [];
  for (const [i, digits] of laps.slice(0, n).entries()) {
    if (digits === "") {
      values.push(null);
      continue;
    }
    const cs = digitsToCs(digits);
    if (cs === null || cs <= 0) return `${(i + 1) * LAP_DISTANCE}m のラップが正しくありません。`;
    values.push(cs);
  }

  const lastIndex = n - 1;
  const others = values.slice(0, lastIndex);
  if (values[lastIndex] === null && totalCs && others.every((v) => v !== null)) {
    const rest = totalCs - others.reduce<number>((a, b) => a + (b ?? 0), 0);
    if (rest > 0) values[lastIndex] = rest;
  }
  return values;
}

/**
 * ラップがない行からは laps_cs を取り除きます。
 * （ラップ用の SQL をまだ実行していなくても、ラップなしの記録は保存できるようにするため）
 */
export function withoutEmptyLaps<T extends { laps_cs?: (number | null)[] | null }>(row: T): Omit<T, "laps_cs"> | T {
  if (row.laps_cs && row.laps_cs.length > 0) return row;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { laps_cs, ...rest } = row;
  return rest;
}

import { Solar } from "lunar-typescript";

// 해당 연·월의 월주(月柱) 간지 — 절기 경계를 피하기 위해 매월 15일 정오를 대표일로 계산.
export function getMonthGanZhi(year: number, month: number): string {
  return Solar.fromYmdHms(year, month, 15, 12, 0, 0).getLunar().getEightChar().getMonth();
}

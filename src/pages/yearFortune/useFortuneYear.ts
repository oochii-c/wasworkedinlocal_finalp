import { useSaju } from "../../state/SajuContext";
import { getChartYearRange } from "./saju/ganzhi";
import { SajuExtended } from "./saju/types";

/* 이 화면이 보여줄 연도 한 벌.
   연도 이동(화살표)은 걷어냈고, context 의 year 를 이 원국의 세운 범위로 가둔다. */
export function useFortuneYear(chart: SajuExtended | null): number {
  const { year } = useSaju();
  const now = new Date().getFullYear();
  if (!chart) return Number.isInteger(year) ? year : now;
  const { min, max } = getChartYearRange(chart);
  return Number.isInteger(year) ? Math.min(Math.max(year, min), max) : min;
}

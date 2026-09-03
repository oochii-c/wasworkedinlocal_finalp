import { useSaju } from "../../state/SajuContext";
import { getChartYearRange } from "./saju/ganzhi";
import { SajuExtended } from "./saju/types";

/* 이 화면이 보여줄 연도 한 벌.
   연도 이동(화살표)을 걷어내서 지금은 clamp 만 남았지만, 계산을 여기 모아두는
   이유는 그대로다 — 전에는 YearFortunePage(범위 clamp)와 YearFortuneDetail
   (화살표 활성 여부)이 getChartYearRange 를 따로 호출했고 openYear 가 두 단계를
   그냥 통과해, 연도 UI 를 건드리면 파일 세 개가 흔들렸다. */
export function useFortuneYear(chart: SajuExtended): number {
  const { year } = useSaju();
  const { min, max } = getChartYearRange(chart);
  // context 의 year 는 다른 화면에서도 바뀔 수 있어 이 원국의 범위로 가둔다.
  return Number.isInteger(year) ? Math.min(Math.max(year, min), max) : min;
}

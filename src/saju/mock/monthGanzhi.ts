import { CHEON_GAN, JI_JI, getYearGanZhi } from "../ganzhi";
import { GanZhi } from "../types";

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// 목업: 실제 절기(24절기) 기반 계산이 아니라, 연간지에서 파생한 결정론적 더미값이다.
// TODO: 실제 사주 라이브러리(절기 기반 월주 계산)로 교체할 것.
export function getMonthInGanZhi(year: number, month: number): GanZhi {
  if (month < 1 || month > 12) {
    throw new Error(`month must be between 1 and 12, got ${month}`);
  }
  const yearStemIndex = CHEON_GAN.indexOf(getYearGanZhi(year).gan);
  const stemIndex = mod(yearStemIndex * 2 + month, 10);
  const branchIndex = mod(month + 1, 12);
  return { gan: CHEON_GAN[stemIndex], ji: JI_JI[branchIndex] };
}

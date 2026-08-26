// 목업: 이 파일의 영역별/월별 점수화는 실제 십성(十神) 로직이 아니라 v0.1 휴리스틱이다.
// TODO: 실제 사주 라이브러리의 십성 계산으로 교체할 것.
import { SajuExtended } from "../types";
import { GAN_TO_OHAENG, Ohaeng, ElementRelation, getYearGanZhi, getOhaengRelation } from "../ganzhi";
import { getMonthInGanZhi } from "./monthGanzhi";

export type Domain = "총운" | "애정" | "재물" | "직업학업" | "건강" | "인간관계";

export const DOMAINS: readonly Domain[] = [
  "총운", "애정", "재물", "직업학업", "건강", "인간관계",
] as const;

export const DOMAIN_ELEMENT: Record<Exclude<Domain, "총운">, Ohaeng> = {
  애정: "화",
  재물: "금",
  직업학업: "수",
  건강: "목",
  인간관계: "토",
};

// 휴리스틱 점수표: a(외부 오행: 세운/월운)가 b(기준 오행: 일간 또는 영역 오행)에
// 미치는 영향을 1~5점으로 환산한다. 실제 십성(十神) 로직이 아니라 v0.1 목업 매핑이다.
// chart.ohaeng의 해당 오행 개수가 relationScore를 ±1 보정한다 (역시 v0.1 휴리스틱).
const RELATION_SCORE: Record<ElementRelation, number> = {
  generates: 5,
  same: 4,
  controlled_by: 3,
  generated_by: 2,
  controls: 1,
};

export function computeDomainScores(chart: SajuExtended, year: number): Record<Domain, number> {
  const yearElement = GAN_TO_OHAENG[getYearGanZhi(year).gan];
  const dayMasterElement = GAN_TO_OHAENG[chart.dayMaster];

  const scores = {} as Record<Domain, number>;
  for (const domain of DOMAINS) {
    const targetElement = domain === "총운" ? dayMasterElement : DOMAIN_ELEMENT[domain];
    const relationScore = RELATION_SCORE[getOhaengRelation(yearElement, targetElement)];
    const ohaengCount = chart.ohaeng[targetElement];
    const ohaengAdjustment = ohaengCount >= 3 ? 1 : ohaengCount === 0 ? -1 : 0;
    scores[domain] = Math.max(1, Math.min(5, relationScore + ohaengAdjustment));
  }
  return scores;
}

export function computeOverallScore(scores: Record<Domain, number>): number {
  const values = DOMAINS.map((domain) => scores[domain]);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.max(1, Math.min(5, Math.round(average)));
}

export function computeMonthlyScores(chart: SajuExtended, year: number): number[] {
  const dayMasterElement = GAN_TO_OHAENG[chart.dayMaster];
  const scores: number[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthElement = GAN_TO_OHAENG[getMonthInGanZhi(year, month).gan];
    scores.push(RELATION_SCORE[getOhaengRelation(monthElement, dayMasterElement)]);
  }
  return scores;
}

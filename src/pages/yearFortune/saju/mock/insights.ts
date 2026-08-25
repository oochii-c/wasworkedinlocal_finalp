// 목업: 이 파일의 코멘트/설명 문구는 실제 십성(十神) 해석이 아니라 v0.1 목업
// 문구 테이블이다. 점수 구간(고/중/저)에 따라 고정된 문구를 고르는 방식으로,
// 나중에 실제 사주 해석 로직으로 교체되어야 한다.
import { Domain, DOMAIN_ELEMENT } from "./scoring";
import { CheonGan, SajuExtended } from "../types";
import { ElementRelation, getElementRelation, getOhaengRelation, getYearGanZhi, GAN_TO_OHAENG } from "../ganzhi";

type Tier = "high" | "mid" | "low";

function tierOf(score: number): Tier {
  if (score >= 4) return "high";
  if (score <= 2) return "low";
  return "mid";
}

const DOMAIN_CAPTIONS: Record<Domain, Record<Tier, string>> = {
  총운: { high: "변화 속 성장", mid: "무난한 흐름", low: "숨 고르기 필요" },
  애정: { high: "상반기 인연", mid: "잔잔한 흐름", low: "거리두기 필요" },
  재물: { high: "하반기 수입↑", mid: "안정적 흐름", low: "지출 관리 필요" },
  직업학업: { high: "실력 인정받음", mid: "꾸준한 성과", low: "재정비 필요" },
  건강: { high: "水 기운 보충", mid: "컨디션 관리", low: "휴식 필요" },
  인간관계: { high: "귀인 등장", mid: "무난한 관계", low: "갈등 주의" },
};

export function getDomainCaption(domain: Domain, score: number): string {
  return DOMAIN_CAPTIONS[domain][tierOf(score)];
}

// 세운(그 해 연간지)의 오행과, 영역이 배정된 오행(총운은 일간) 간의 상생상극
// 관계를 근거로 한 상세 해설을 만든다. computeDomainScores와 같은 관계 방향
// (a=세운 오행, b=영역 오행)을 쓴다.
function domainLabel(domain: Domain): string {
  return domain === "총운" ? "총운" : `${domain} 영역`;
}

const DOMAIN_RELATION_INTERPRETATIONS: Record<ElementRelation, (domain: Domain) => string> = {
  generates: (domain) =>
    `올해 세운의 기운이 ${domainLabel(domain)}에 힘을 보태줘서 좋은 흐름으로 이어지기 쉬운 해입니다.`,
  same: (domain) =>
    `올해 세운의 기운이 ${domainLabel(domain)}에 그대로 겹쳐 자신감 있게 밀어붙이기 좋은 해입니다.`,
  controlled_by: (domain) =>
    `${domainLabel(domain)}에 쌓인 기운으로 올해 세운을 다스릴 수 있어 유리하게 활용하기 좋은 해입니다.`,
  generated_by: (domain) =>
    `올해 세운에 ${domainLabel(domain)}의 기운을 많이 내어주는 해라 체력과 감정 관리가 필요합니다.`,
  controls: (domain) =>
    `올해 세운의 기운이 강해 ${domainLabel(domain)}에 부담이 실리기 쉬우니 무리하지 않는 게 좋습니다.`,
};

export function getDomainInterpretation(domain: Domain, chart: SajuExtended, year: number): string {
  const yearElement = GAN_TO_OHAENG[getYearGanZhi(year).gan];
  const dayMasterElement = GAN_TO_OHAENG[chart.dayMaster];
  const targetElement = domain === "총운" ? dayMasterElement : DOMAIN_ELEMENT[domain];

  const base = DOMAIN_RELATION_INTERPRETATIONS[getOhaengRelation(yearElement, targetElement)](domain);

  const ohaengCount = chart.ohaeng[targetElement];
  const adjustment =
    ohaengCount >= 3
      ? " 사주 원국에 관련 오행이 풍부해 그 효과가 한층 강하게 작용합니다."
      : ohaengCount === 0
        ? " 다만 사주 원국에 해당 오행이 없어 그 영향력은 다소 약해집니다."
        : "";

  return base + adjustment;
}

// 월간지의 오행과 일간의 상생상극 관계를 근거로 한 줄 해설을 만든다.
// scoring.ts의 RELATION_SCORE와 같은 관계 방향(a=월간지 오행, b=일간 오행)을 쓴다.
const RELATION_INTERPRETATIONS: Record<ElementRelation, string> = {
  generates: "이 달의 기운이 일간에 힘을 보태줘서 하는 일이 순조롭게 풀립니다",
  same: "일간과 같은 기운이 겹쳐 자신감 있게 밀어붙이기 좋습니다",
  controlled_by: "일간이 이 달의 기운을 다스릴 수 있어 유리하게 활용할 수 있습니다",
  generated_by: "일간이 기운을 많이 내주는 달이라 체력과 감정 관리가 필요합니다",
  controls: "이 달의 기운이 강해 일간이 눌리기 쉬우니 무리하지 않는 게 좋습니다",
};

export function getMonthInterpretation(monthGan: CheonGan, dayMaster: CheonGan): string {
  return RELATION_INTERPRETATIONS[getElementRelation(monthGan, dayMaster)];
}

// 월별 흐름 막대 색상(MonthlyFlow)도 이 두 기준을 그대로 써서, "좋은 달/주의 달"
// 범례가 아래 좋은/주의 시기 목록과 항상 같은 기준을 가리키게 한다.
export const GOOD_MONTH_THRESHOLD = 4;
export const CAUTION_MONTH_THRESHOLD = 2;

// monthlyScores: 길이 12, index 0 = 1월. 반환값은 1~12 사이 월 번호 목록이다.
export function getGoodMonths(monthlyScores: number[]): number[] {
  return monthlyScores
    .map((score, i) => ({ score, month: i + 1 }))
    .filter(({ score }) => score >= GOOD_MONTH_THRESHOLD)
    .map(({ month }) => month);
}

export function getCautionMonths(monthlyScores: number[]): number[] {
  return monthlyScores
    .map((score, i) => ({ score, month: i + 1 }))
    .filter(({ score }) => score <= CAUTION_MONTH_THRESHOLD)
    .map(({ month }) => month);
}

// [3,4,5,11] -> "3~5월 · 11월" 형태로 연속 구간은 묶고, 떨어진 달은 "·"로 구분한다.
export function formatMonthRanges(months: number[]): string {
  if (months.length === 0) return "-";

  const sorted = [...months].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === end + 1) {
      end = current;
      continue;
    }
    ranges.push(start === end ? `${start}월` : `${start}~${end}월`);
    if (current !== undefined) {
      start = current;
      end = current;
    }
  }

  return ranges.join(" · ");
}

export const GOOD_PERIOD_CAPTION = "재물·직업 피크. 큰 결정하기 좋음";
export const CAUTION_PERIOD_CAPTION = "충돌·지출 조심. 중요 계약 보류 권장";

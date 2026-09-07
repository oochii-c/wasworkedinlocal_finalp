// LLM 해설(영역 설명·월별 풀이)이 아직 오지 않았거나 실패했을 때 자리를 채우는
// 결정론적 폴백 문구. 세운/월운 오행과 일간·영역 오행의 상생상극 관계를 근거로 한다.
import { Domain } from "./scoring";
import { CheonGan } from "./types";
import {
  ElementRelation,
  getElementRelation,
  getOhaengRelation,
  getYearGanZhi,
  GAN_TO_OHAENG,
  ohaengOfHanjaGan,
  type Ohaeng,
} from "./ganzhi";

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
  직업: { high: "실력 인정받음", mid: "꾸준한 성과", low: "재정비 필요" },
  학업: { high: "집중력 상승", mid: "꾸준한 성취", low: "기초 다지기" },
  건강: { high: "水 기운 보충", mid: "컨디션 관리", low: "휴식 필요" },
  인간관계: { high: "귀인 등장", mid: "무난한 관계", low: "갈등 주의" },
};

export function getDomainCaption(domain: Domain, score: number): string {
  return DOMAIN_CAPTIONS[domain][tierOf(score)];
}

// 폴백 해설의 관계 판정에 쓰는 영역 대표 오행(한글). 총운은 일간 오행을 기준으로 한다.
const DOMAIN_ELEMENT_KOR: Record<Exclude<Domain, "총운">, Ohaeng> = {
  애정: "화", 재물: "금", 직업: "수", 학업: "목", 건강: "목", 인간관계: "토",
};

function domainLabel(domain: Domain): string {
  return domain === "총운" ? "총운" : `${domain} 영역`;
}

const DOMAIN_RELATION_INTERPRETATIONS: Record<ElementRelation, (domain: Domain) => string> = {
  generates: (d) => `올해 세운의 기운이 ${domainLabel(d)}에 힘을 보태줘서 좋은 흐름으로 이어지기 쉬운 해입니다.`,
  same: (d) => `올해 세운의 기운이 ${domainLabel(d)}에 그대로 겹쳐 자신감 있게 밀어붙이기 좋은 해입니다.`,
  controlled_by: (d) => `${domainLabel(d)}에 쌓인 기운으로 올해 세운을 다스릴 수 있어 유리하게 활용하기 좋은 해입니다.`,
  generated_by: (d) => `올해 세운에 ${domainLabel(d)}의 기운을 많이 내어주는 해라 체력과 감정 관리가 필요합니다.`,
  controls: (d) => `올해 세운의 기운이 강해 ${domainLabel(d)}에 부담이 실리기 쉬우니 무리하지 않는 게 좋습니다.`,
};

export function getDomainInterpretation(domain: Domain, dayGanHanja: string, year: number): string {
  const yearElement = GAN_TO_OHAENG[getYearGanZhi(year).gan];
  const targetElement = domain === "총운" ? ohaengOfHanjaGan(dayGanHanja) : DOMAIN_ELEMENT_KOR[domain];
  return DOMAIN_RELATION_INTERPRETATIONS[getOhaengRelation(yearElement, targetElement)](domain);
}

// 월간지 오행과 일간(한글)의 상생상극 관계를 근거로 한 줄 해설.
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

// 점수(1~5) → 색. MonthlyFlow 그래프 점과 영역 박스가 같은 코드를 쓴다.
// 1점 빨강 · 2점 노랑 · 3~5점 파랑.
export const SCORE_RED = "#F45B5B";   // var(--saju-red)
export const SCORE_YELLOW = "#EACB8A"; // var(--saju-gold)
export const SCORE_BLUE = "#66B2D6";  // var(--saju-blue-300)

export function scoreColor(score: number): string {
  if (score <= 1) return SCORE_RED;
  if (score === 2) return SCORE_YELLOW;
  return SCORE_BLUE;
}

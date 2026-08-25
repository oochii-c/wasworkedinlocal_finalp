import { GAN_TO_WUXING, WUXING_ORDER } from "../saju/fortune";

/* ============================================================
   yearInsights.ts
   연도 상세(year.tsx) 전용 오행 상생상극 휴리스틱.
   실제 십성(十神) 로직이 아니라 v0.1 휴리스틱 — DaYunFlow의 seWunScore와는
   별개 스케일(값 의미가 다름)이라 공유하지 않고 이 파일에 독립적으로 둔다.
   ============================================================ */

export type ElementRelation = "generates" | "generated_by" | "controls" | "controlled_by" | "same";

// a(영향을 주는 쪽)가 b(대상)에 미치는 오행 관계
export function getWuxingRelation(a: string, b: string): ElementRelation {
  if (a === b) return "same";
  const ai = WUXING_ORDER.indexOf(a);
  const bi = WUXING_ORDER.indexOf(b);
  if (ai < 0 || bi < 0) return "same";
  if ((ai + 1) % 5 === bi) return "generates";
  if ((ai + 2) % 5 === bi) return "controls";
  if ((bi + 1) % 5 === ai) return "generated_by";
  return "controlled_by";
}

const RELATION_SCORE: Record<ElementRelation, number> = {
  generates: 5,
  same: 4,
  controlled_by: 3,
  generated_by: 2,
  controls: 1,
};

export type Domain = "총운" | "애정" | "재물" | "직업학업" | "건강" | "인간관계";

export const DOMAINS: readonly Domain[] = ["총운", "애정", "재물", "직업학업", "건강", "인간관계"] as const;

const DOMAIN_ELEMENT: Record<Exclude<Domain, "총운">, string> = {
  애정: "火",
  재물: "金",
  직업학업: "水",
  건강: "木",
  인간관계: "土",
};

export function targetElementOf(domain: Domain, dayGan: string): string {
  return domain === "총운" ? GAN_TO_WUXING[dayGan] : DOMAIN_ELEMENT[domain];
}

export function computeDomainScores(
  wuXingCount: Record<string, number>,
  dayGan: string,
  yearGan: string
): Record<Domain, number> {
  const yearElement = GAN_TO_WUXING[yearGan];
  const scores = {} as Record<Domain, number>;
  for (const domain of DOMAINS) {
    const targetElement = targetElementOf(domain, dayGan);
    const relScore = RELATION_SCORE[getWuxingRelation(yearElement, targetElement)];
    const count = wuXingCount[targetElement] ?? 0;
    const adjustment = count >= 3 ? 1 : count === 0 ? -1 : 0;
    scores[domain] = Math.max(1, Math.min(5, relScore + adjustment));
  }
  return scores;
}

export function computeOverallScore(scores: Record<Domain, number>): number {
  const values = DOMAINS.map((d) => scores[d]);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.max(1, Math.min(5, Math.round(avg)));
}

type Tier = "high" | "mid" | "low";
function tierOf(score: number): Tier {
  if (score >= 4) return "high";
  if (score <= 2) return "low";
  return "mid";
}

const DOMAIN_CAPTIONS: Record<Domain, Record<Tier, string>> = {
  총운: { high: "변화 속 성장", mid: "무난한 흐름", low: "숨 고르기 필요" },
  애정: { high: "상반기 인연", mid: "잔잔한 흐름", low: "거리두기 필요" },
  재물: { high: "수입 흐름 좋음", mid: "안정적 흐름", low: "지출 관리 필요" },
  직업학업: { high: "실력 인정받음", mid: "꾸준한 성과", low: "재정비 필요" },
  건강: { high: "컨디션 좋음", mid: "컨디션 관리", low: "휴식 필요" },
  인간관계: { high: "귀인 등장", mid: "무난한 관계", low: "갈등 주의" },
};

export function getDomainCaption(domain: Domain, score: number): string {
  return DOMAIN_CAPTIONS[domain][tierOf(score)];
}

function domainLabel(domain: Domain): string {
  return domain === "총운" ? "총운" : `${domain} 영역`;
}

const DOMAIN_RELATION_TEXT: Record<ElementRelation, (domain: Domain) => string> = {
  generates: (d) => `올해 세운의 기운이 ${domainLabel(d)}에 힘을 보태줘서 좋은 흐름으로 이어지기 쉬운 해예요.`,
  same: (d) => `올해 세운의 기운이 ${domainLabel(d)}에 그대로 겹쳐 자신감 있게 밀어붙이기 좋은 해예요.`,
  controlled_by: (d) => `${domainLabel(d)}에 쌓인 기운으로 올해 세운을 다스릴 수 있어 유리하게 활용하기 좋은 해예요.`,
  generated_by: (d) => `올해 세운에 ${domainLabel(d)}의 기운을 많이 내어주는 해라 체력과 감정 관리가 필요해요.`,
  controls: (d) => `올해 세운의 기운이 강해 ${domainLabel(d)}에 부담이 실리기 쉬우니 무리하지 않는 게 좋아요.`,
};

export function getDomainInterpretation(
  domain: Domain,
  wuXingCount: Record<string, number>,
  dayGan: string,
  yearGan: string,
  includeAdjustment = true
): string {
  const yearElement = GAN_TO_WUXING[yearGan];
  const targetElement = targetElementOf(domain, dayGan);
  const base = DOMAIN_RELATION_TEXT[getWuxingRelation(yearElement, targetElement)](domain);
  if (!includeAdjustment) return base;
  const count = wuXingCount[targetElement] ?? 0;
  const adjustment =
    count >= 3
      ? " 사주 원국에 관련 오행이 풍부해 그 기운이 한층 강하게 작용해요."
      : count === 0
        ? " 다만 원국에 해당 오행이 없어 영향력은 다소 약해져요."
        : "";
  return base + adjustment;
}

/* ---- 월별 흐름 ---- */

export function computeMonthlyScores(monthGans: string[], dayGan: string): number[] {
  const dayElement = GAN_TO_WUXING[dayGan];
  return monthGans.map((gan) => {
    const monthElement = GAN_TO_WUXING[gan];
    return RELATION_SCORE[getWuxingRelation(monthElement, dayElement)];
  });
}

const MONTH_RELATION_TEXT: Record<ElementRelation, string> = {
  generates: "이 달의 기운이 일간에 힘을 보태줘서 하는 일이 순조롭게 풀려요.",
  same: "일간과 같은 기운이 겹쳐 자신감 있게 밀어붙이기 좋아요.",
  controlled_by: "일간이 이 달의 기운을 다스릴 수 있어 유리하게 활용할 수 있어요.",
  generated_by: "일간이 기운을 많이 내주는 달이라 체력과 감정 관리가 필요해요.",
  controls: "이 달의 기운이 강해 일간이 눌리기 쉬우니 무리하지 않는 게 좋아요.",
};

// 팝업 목록에서 각 달마다 두 문장 이상 보이도록 실천 조언 한 문장을 덧붙임
const MONTH_RELATION_ADVICE: Record<ElementRelation, string> = {
  generates: "새로운 시도를 해보기에 좋은 타이밍이에요.",
  same: "평소 하던 대로 꾸준히 밀고 나가면 좋은 결과가 따라와요.",
  controlled_by: "미뤄뒀던 일을 정리하거나 마무리 짓기 좋은 달이에요.",
  generated_by: "무리한 일정보다는 컨디션 충전에 신경 쓰는 게 좋아요.",
  controls: "중요한 결정이라면 다음 달로 미뤄보는 것도 방법이에요.",
};

// 세 번째 문장 — 이 달의 오행 근거(월간지 → 오행)를 짧게 덧붙이고,
// 생(生)·극(剋)·비화 같은 용어가 무슨 뜻인지 괄호로 바로 풀이해줌
const MONTH_RELATION_BASIS: Record<ElementRelation, string> = {
  generates: "이 달의 기운이 일간을 생(生)하는 관계라 그래요. (생生은 서로 도와주고 힘을 보태주는 관계예요.)",
  same: "이 달의 기운이 일간과 같은 오행(비화)이라 그래요. (비화는 같은 기운끼리 만나 서로 겹치는 관계예요.)",
  controlled_by: "일간이 이 달의 기운을 극(剋)할 수 있는 관계라 그래요. (극剋은 한쪽이 다른 쪽을 억누르거나 다스린다는 뜻으로, 여기선 일간이 우위에 있다는 의미예요.)",
  generated_by: "일간이 이 달의 기운을 생(生)해주는 관계라 그래요. (내가 상대에게 기운을 나눠주는 관계라 힘이 빠지기 쉬워요.)",
  controls: "이 달의 기운이 일간을 극(剋)하는 관계라 그래요. (이번엔 반대로 이 달의 기운이 일간을 억누르는 관계예요.)",
};

export function getMonthInterpretation(monthGan: string, dayGan: string): string {
  const relation = getWuxingRelation(GAN_TO_WUXING[monthGan], GAN_TO_WUXING[dayGan]);
  return `${MONTH_RELATION_TEXT[relation]} ${MONTH_RELATION_ADVICE[relation]} ${MONTH_RELATION_BASIS[relation]}`;
}

export const GOOD_MONTH_THRESHOLD = 4;
export const CAUTION_MONTH_THRESHOLD = 2;

// monthlyScores: 길이 12, index 0 = 1월
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

// [3,4,5,11] -> "3~5월 · 11월"
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

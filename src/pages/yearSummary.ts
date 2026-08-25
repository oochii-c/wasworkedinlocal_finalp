import { GAN_TO_WUXING } from "../saju/fortune";
import { HANJA_DOK } from "./dashboard/constants";
import {
  DOMAINS,
  type Domain,
  type ElementRelation,
  getWuxingRelation,
  getDomainInterpretation,
  targetElementOf,
  computeMonthlyScores,
  getGoodMonths,
  getCautionMonths,
  formatMonthRanges,
} from "./yearInsights";

/* ============================================================
   yearSummary.ts
   "용왕님의 세운 풀이" 긴 총평 + 근거(각주)를 AI 호출 없이 결정론적으로 생성.
   위쪽 영역별 별점·월별 막대그래프와 같은 계산(yearInsights.ts)을 그대로 문장으로
   풀어 쓰는 것이라, 화면에 보이는 수치와 절대 어긋나지 않는다.
   ============================================================ */

const ELEMENT_KR: Record<string, string> = { 木: "목", 火: "화", 土: "토", 金: "금", 水: "수" };

// a(영향을 주는 쪽) → b 관계를 "화극금(火剋金)"처럼 한글+한자 병기로
function relationPhrase(aElem: string, bElem: string, relation: ElementRelation): string {
  const aKr = ELEMENT_KR[aElem], bKr = ELEMENT_KR[bElem];
  switch (relation) {
    case "generates": return `${aKr}생${bKr}(${aElem}生${bElem})`;
    case "controls": return `${aKr}극${bKr}(${aElem}剋${bElem})`;
    case "same": return "비화(比和)";
    case "generated_by": return `${bKr}생${aKr}(${bElem}生${aElem})`;
    case "controlled_by": return `${bKr}극${aKr}(${bElem}剋${aElem})`;
  }
}

// 각주용 — 한자 없이 한글만
function relationKr(aElem: string, bElem: string, relation: ElementRelation): string {
  const aKr = ELEMENT_KR[aElem], bKr = ELEMENT_KR[bElem];
  switch (relation) {
    case "generates": return `${aKr}생${bKr}`;
    case "controls": return `${aKr}극${bKr}`;
    case "same": return "비화";
    case "generated_by": return `${bKr}생${aKr}`;
    case "controlled_by": return `${bKr}극${aKr}`;
  }
}

const RELATION_LABEL: Record<ElementRelation, string> = {
  generates: "생조", same: "비화", controlled_by: "통제", generated_by: "설기", controls: "상극",
};

const OVERALL_THEME: Record<ElementRelation, string> = {
  generates: "세운의 도움을 받아 순탄하게 뻗어나가는 해",
  same: "일간과 기운이 겹쳐 자신감 있게 밀어붙이는 해",
  controlled_by: "일간이 세운을 다스릴 수 있어 유리하게 활용하는 해",
  generated_by: "일간이 기운을 내어주는 설기(泄氣)의 해",
  controls: "외부의 압력에 맞서며 실속을 다지는 해",
};

// 관계 종류에 맞는 연결 동사 — "부딪혀오는"은 상극(충돌)일 때만 어울려서 나머지는 다르게
const OVERALL_CONNECTOR: Record<ElementRelation, string> = {
  generates: "다가와 힘을 보태주는",
  same: "겹쳐드는",
  controlled_by: "다가와 일간이 다스릴 수 있는",
  generated_by: "다가와 일간의 기운을 이끌어내는",
  controls: "부딪혀오는",
};

const MONTH_FLOW: Record<ElementRelation, { mid: string; end: string }> = {
  generates: { mid: "일간에 힘을 보태주는 생조의 흐름을 타고", end: "일간에 힘을 보태주는 생조의 흐름입니다" },
  same: { mid: "일간과 같은 기운이 겹치는 비화의 흐름이고", end: "일간과 같은 기운이 겹치는 비화의 흐름입니다" },
  controlled_by: { mid: "일간이 그 기운을 다스릴 수 있어 큰 기복 없이 무난하게 지나가고", end: "일간이 그 기운을 다스릴 수 있어 큰 기복 없이 무난하게 지나갑니다" },
  generated_by: { mid: "일간이 기운을 내어주는 설기(泄氣) 구간이라 체력·감정 소모가 커지고", end: "일간이 기운을 내어주는 설기(泄氣) 구간이라 체력·감정 소모가 커집니다" },
  controls: { mid: "일간을 직접 극하는 구간이라 갈등과 스트레스가 몰리고", end: "일간을 직접 극하는 구간이라 갈등과 스트레스가 몰립니다" },
};

const MONTH_CITATION_LABEL: Record<ElementRelation, string> = {
  generates: "일간을 돕는 생조 관계", same: "일간을 돕는 생조 관계",
  generated_by: "일간이 기운을 내어주는 설기 관계",
  controls: "일간을 직접 극하는 관계",
  controlled_by: "일간이 다스릴 수 있는 관계",
};

interface MonthGroup { start: number; end: number; elements: string[]; relation: ElementRelation }

// 연속된 달 중 일간과의 오행 관계가 같은 구간끼리 묶음 (index 0 = 1월)
// monthGanZhiList: 각 달의 월주 간지 전체 문자열(예: "己丑") — 첫 글자(천간)만 오행 판단에 씀
function groupMonths(monthGanZhiList: string[], dayGan: string): MonthGroup[] {
  const dayElement = GAN_TO_WUXING[dayGan];
  const groups: MonthGroup[] = [];
  monthGanZhiList.forEach((ganZhi, i) => {
    const month = i + 1;
    const elem = GAN_TO_WUXING[ganZhi[0]];
    const relation = getWuxingRelation(elem, dayElement);
    const last = groups[groups.length - 1];
    if (last && last.relation === relation && last.end === month - 1) {
      last.end = month;
      if (!last.elements.includes(elem)) last.elements.push(elem);
    } else {
      groups.push({ start: month, end: month, elements: [elem], relation });
    }
  });
  return groups;
}

function monthRangeLabel(g: { start: number; end: number }): string {
  return g.start === g.end ? `${g.start}월` : `${g.start}~${g.end}월`;
}

// AI 호출 없이 결정론적으로 만드는 긴 총평 — 원국·세운·월별 데이터를 그대로 서술
export function generateYearSummary(
  year: number,
  yearGanZhi: string,
  dayGan: string,
  dayGanKr: string,
  yearGanKr: string,
  wuXingCount: Record<string, number>,
  monthGanZhiList: string[]
): string {
  const yearGan = yearGanZhi[0];
  const yearElement = GAN_TO_WUXING[yearGan];
  const dayElement = GAN_TO_WUXING[dayGan];
  const overallRelation = getWuxingRelation(yearElement, dayElement);

  const opening =
    `${year}년 ${yearGanZhi}(${HANJA_DOK[yearGan] ?? ""}${HANJA_DOK[yearGanZhi[1]] ?? ""})년은 ` +
    `일간 ${dayGan}(${dayGanKr})에게 세운 천간 ${yearGan}(${yearGanKr})이 ${OVERALL_CONNECTOR[overallRelation]} ` +
    `${relationPhrase(yearElement, dayElement, overallRelation)}의 해로, ` +
    `한 해 전체를 관통하는 흐름은 '${OVERALL_THEME[overallRelation]}'입니다.`;

  const groups = groupMonths(monthGanZhiList, dayGan);
  const monthSentence =
    groups
      .map((g, i) => {
        const flow = i === groups.length - 1 ? MONTH_FLOW[g.relation].end : MONTH_FLOW[g.relation].mid;
        return `${monthRangeLabel(g)}은 월간이 ${g.elements.map((e) => ELEMENT_KR[e]).join("·")} 기운이라 ${flow}`;
      })
      .join(", ") + ".";

  const monthlyScores = computeMonthlyScores(monthGanZhiList.map((gz) => gz[0]), dayGan);
  const goodRange = formatMonthRanges(getGoodMonths(monthlyScores));
  const cautionRange = formatMonthRanges(getCautionMonths(monthlyScores));
  const periodParts: string[] = [];
  if (goodRange !== "-") {
    periodParts.push(`${goodRange}은 재물·직업 운이 정점을 찍어 이직이나 이사처럼 환경을 바꾸는 결정을 내리기에 좋은 시기`);
  }
  if (cautionRange !== "-") {
    periodParts.push(`반대로 ${cautionRange}은 인간관계나 지출에서 마찰이 생기기 쉬워 중요한 계약이나 큰 지출은 미루는 편이 좋습니다`);
  }
  const periodSentence = periodParts.length ? `이런 흐름에 따라 ${periodParts.join("이고, ")}.` : "";

  // 오행 개수 보정 문구는 "?" 툴팁(getDomainInterpretation 기본값)에서만 보여주고,
  // 여기서는 여러 영역에 같은 문장이 반복되는 걸 피하려 기본 관계 문장만 이어붙임
  const domainSentence = DOMAINS.map((d) => getDomainInterpretation(d, wuXingCount, dayGan, yearGan, false)).join(" ");

  const closing =
    goodRange !== "-"
      ? `새로운 곳에 자리를 잡거나 이사를 계획하고 있다면, 앞서 말한 ${goodRange} 구간 안에 결정을 마무리하는 편이 유리합니다.`
      : "";

  return [opening, monthSentence, periodSentence, domainSentence, closing].filter(Boolean).join(" ");
}

// 위 총평의 "근거" 각주 — 관계·점수·오행 개수·월별 분류를 수치 그대로 나열
export function generateYearCitation(
  yearGanZhi: string,
  dayGan: string,
  wuXingCount: Record<string, number>,
  domainScores: Record<Domain, number>,
  monthGanZhiList: string[]
): string {
  const yearGan = yearGanZhi[0];
  const yearZhi = yearGanZhi[1];
  const yearElement = GAN_TO_WUXING[yearGan];
  const dayElement = GAN_TO_WUXING[dayGan];
  const overallRelation = getWuxingRelation(yearElement, dayElement);

  const domainParts = DOMAINS.map((d) => {
    const target = targetElementOf(d, dayGan);
    const relation = getWuxingRelation(yearElement, target);
    // "same"은 relationKr·RELATION_LABEL이 둘 다 "비화"라 겹쳐 쓰지 않음
    const relLabel = relation === "same" ? "비화(比和)" : `${relationKr(yearElement, target, relation)} ${RELATION_LABEL[relation]}`;
    return `${d}(오행 ${ELEMENT_KR[target]}): ${relLabel} 관계라 ${domainScores[d]}/5점`;
  }).join(", ");

  const wxOrder = ["木", "火", "土", "金", "水"];
  const wxLine = wxOrder.map((e) => `${ELEMENT_KR[e]}${wuXingCount[e] ?? 0}`).join("·");

  const groups = groupMonths(monthGanZhiList, dayGan);
  const monthLine = groups
    .map((g) => `${monthRangeLabel(g)}(${g.elements.map((e) => ELEMENT_KR[e]).join("·")})은 ${MONTH_CITATION_LABEL[g.relation]}`)
    .join(", ");

  return (
    `세운 ${yearGanZhi}(${HANJA_DOK[yearGan] ?? ""}${HANJA_DOK[yearZhi] ?? ""})는 천간 ${yearGan}·지지 ${yearZhi} 모두 ` +
    `${ELEMENT_KR[yearElement]}(${yearElement}) 기운이며, 일간 ${dayGan}(${ELEMENT_KR[dayElement]})과는 ` +
    `${relationPhrase(yearElement, dayElement, overallRelation)}의 관계입니다. ` +
    `영역별 점수는 세운 오행(${ELEMENT_KR[yearElement]})과 각 영역에 배정된 오행의 상생상극 관계로 산출됩니다 — ${domainParts}입니다. ` +
    `여기에 사주 원국의 오행 개수(${wxLine})가 각 영역 점수에 ±1로 반영됩니다. ` +
    `월별 좋은/주의 달은 각 달의 월간(月干) 오행과 일간 ${ELEMENT_KR[dayElement]}의 관계로 산출했습니다 — ${monthLine}로 분류됩니다.`
  );
}

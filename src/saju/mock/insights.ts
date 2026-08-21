// 목업: 이 파일의 코멘트/설명 문구는 실제 십성(十神) 해석이 아니라 v0.1 목업
// 문구 테이블이다. 점수 구간(고/중/저)에 따라 고정된 문구를 고르는 방식으로,
// 나중에 실제 사주 해석 로직으로 교체되어야 한다.
import { Domain } from "./scoring";

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

const GOOD_MONTH_THRESHOLD = 4;
const CAUTION_MONTH_THRESHOLD = 2;

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

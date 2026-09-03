import { SajuExtended } from "./saju/types";
import { getMonthInGanZhi } from "./saju/monthGanzhi";
import { computeDomainScores, computeMonthlyScores, type Domain } from "./saju/scoring";
import { getDomainInterpretation } from "./saju/insights";
import { HANJA_TO_CHEON_GAN } from "./saju/ganzhi";
import { YearNav } from "./components/YearNav";
import { DomainStars } from "./components/DomainStars";
import { MonthlyFlow } from "./components/MonthlyFlow";
import { AiSummary } from "./components/AiSummary";
import styles from "./YearFortuneDetail.module.css";

export interface YearFortuneDetailProps {
  chart: SajuExtended;
  year: number;
  gender: string;
  summary: string | null;                              // AI 총평 (긴 글)
  yearSummary?: string | null;                         // 올해 풀이 = AI 총평의 응원 톤 요약
  domainTexts?: Record<string, string> | null;         // 영역 6개 LLM 설명
  monthTexts?: string[] | null;                        // 월별 12개 LLM 풀이
  summaryLoading?: boolean;
  summaryError?: boolean;
}

export function YearFortuneDetail({
  chart,
  year,
  gender,
  summary,
  yearSummary,
  domainTexts,
  monthTexts,
  summaryLoading,
  summaryError,
}: YearFortuneDetailProps) {
  const domainScores = computeDomainScores(chart, year, gender);
  const monthlyScores = computeMonthlyScores(chart, year);
  const monthlyGanZhi = Array.from({ length: 12 }, (_, i) => getMonthInGanZhi(year, i + 1));
  const dayGanKor = HANJA_TO_CHEON_GAN[chart.dayGan];
  // 올해 풀이 = AI 총평의 요약. 아직 안 왔거나 실패하면 로컬 폴백 문구로 자리를 채운다.
  const monthlyDefault = yearSummary || getDomainInterpretation("총운", chart.dayGan, year);

  return (
    <div className={styles.page}>
      <YearNav chart={chart}>
        <MonthlyFlow
          monthlyScores={monthlyScores}
          monthlyGanZhi={monthlyGanZhi}
          dayMaster={dayGanKor}
          monthTexts={monthTexts}
          yearSummary={monthlyDefault}
          yearLoading={summaryLoading}
        />
      </YearNav>
      <DomainStars
        scores={domainScores}
        descriptions={domainTexts as Partial<Record<Domain, string>> | null | undefined}
        dayGanHanja={chart.dayGan}
        year={year}
      />
      <AiSummary summary={summary} loading={summaryLoading} error={summaryError} />
    </div>
  );
}

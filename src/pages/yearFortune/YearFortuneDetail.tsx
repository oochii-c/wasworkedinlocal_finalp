import { SajuExtended } from "./saju/types";
import { getMonthInGanZhi } from "./saju/mock/monthGanzhi";
import { computeDomainScores, computeMonthlyScores } from "./saju/mock/scoring";
import { getDomainInterpretation } from "./saju/mock/insights";
import { YearNav } from "./components/YearNav";
import { DomainStars } from "./components/DomainStars";
import { MonthlyFlow } from "./components/MonthlyFlow";
import { AiSummary } from "./components/AiSummary";
import styles from "./YearFortuneDetail.module.css";

export interface YearFortuneDetailProps {
  chart: SajuExtended;
  year: number;
  summary: string | null;
  summaryLoading?: boolean;
  summaryError?: boolean;
}

export function YearFortuneDetail({
  chart,
  year,
  summary,
  summaryLoading,
  summaryError,
}: YearFortuneDetailProps) {
  const domainScores = computeDomainScores(chart, year);
  const monthlyScores = computeMonthlyScores(chart, year);
  const monthlyGanZhi = Array.from({ length: 12 }, (_, i) => getMonthInGanZhi(year, i + 1));
  // 총운 = 올해 풀이. 월별 흐름 설명문 자리에서 기본값으로 상시 노출된다.
  const yearSummary = getDomainInterpretation("총운", chart, year);

  return (
    <div className={styles.page}>
      <YearNav chart={chart}>
        <MonthlyFlow
          monthlyScores={monthlyScores}
          monthlyGanZhi={monthlyGanZhi}
          dayMaster={chart.dayMaster}
          yearSummary={yearSummary}
        />
      </YearNav>
      <DomainStars scores={domainScores} chart={chart} year={year} />
      <AiSummary summary={summary} loading={summaryLoading} error={summaryError} />
    </div>
  );
}

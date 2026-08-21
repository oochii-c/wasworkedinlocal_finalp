import { SajuExtended } from "@/saju/types";
import { getYearGanZhi, getChartYearRange } from "@/saju/ganzhi";
import { getMonthInGanZhi } from "@/saju/mock/monthGanzhi";
import { computeDomainScores, computeOverallScore, computeMonthlyScores } from "@/saju/mock/scoring";
import { YearNav } from "./components/YearNav";
import { DomainStars } from "./components/DomainStars";
import { MonthlyFlow } from "./components/MonthlyFlow";
import { GoodBadMonths } from "./components/GoodBadMonths";
import { AiSummary } from "./components/AiSummary";
import styles from "./YearFortuneDetail.module.css";

export interface YearFortuneDetailProps {
  chart: SajuExtended;
  year: number;
  summary: string;
  citation?: string;
}

export function YearFortuneDetail({ chart, year, summary, citation }: YearFortuneDetailProps) {
  const yearGanZhi = getYearGanZhi(year);
  const domainScores = computeDomainScores(chart, year);
  const overallScore = computeOverallScore(domainScores);
  const monthlyScores = computeMonthlyScores(chart, year);
  const monthlyGanZhi = Array.from({ length: 12 }, (_, i) => getMonthInGanZhi(year, i + 1));

  const { min: minYear, max: maxYear } = getChartYearRange(chart);

  return (
    <div className={styles.page}>
      <YearNav
        year={year}
        yearGanZhi={yearGanZhi}
        overallScore={overallScore}
        canGoPrev={year > minYear}
        canGoNext={year < maxYear}
      />
      <DomainStars scores={domainScores} />
      <MonthlyFlow
        monthlyScores={monthlyScores}
        monthlyGanZhi={monthlyGanZhi}
        dayMaster={chart.dayMaster}
      />
      <GoodBadMonths monthlyScores={monthlyScores} />
      <AiSummary summary={summary} citation={citation} />
    </div>
  );
}

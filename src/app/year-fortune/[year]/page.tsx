import { notFound } from "next/navigation";
import { getChartYearRange } from "@/saju/ganzhi";
import { sampleChart } from "@/saju/mock/sampleChart";
import { YearFortuneDetail } from "./YearFortuneDetail";

export default async function YearFortunePage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const yearNum = Number(year);
  const { min, max } = getChartYearRange(sampleChart);
  if (!Number.isInteger(yearNum) || yearNum < min || yearNum > max) {
    notFound();
  }

  // 목업: 실제 LLM이 생성할 AI 총평을 대신하는 자리표시자다. 아직 문구는 비워둔다.
  // 실제 AI 총평이 채워질 때는 summary와 citation(근거)이 항상 함께 와야 한다.
  // 또한 총평에는 당신의 한 해 전체 흐름뿐 아니라, 이사 등 환경을 바꾸기 좋은
  // 구체적인 날짜(이사 길일)도 함께 포함되어야 한다. 실제 이사 길일 계산 로직은
  // 이번 범위 밖이며, 이 요구사항만 남겨둔다.
  const sampleSummary = "";
  const sampleCitation = "";

  return (
    <YearFortuneDetail
      chart={sampleChart}
      year={yearNum}
      summary={sampleSummary}
      citation={sampleCitation || undefined}
    />
  );
}

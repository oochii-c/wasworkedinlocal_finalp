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

  // 목업: 실제 LLM이 생성할 AI 총평을 대신하는 하드코딩된 placeholder 텍스트다.
  const sampleSummary =
    "올해는 대체로 안정적인 흐름 속에서 새로운 기회가 찾아오는 해입니다. 상반기에는 관계에서 오는 스트레스에 주의가 필요하지만, 하반기로 갈수록 재물운이 살아나며 성과로 이어질 가능성이 큽니다. 무리한 확장보다는 기존의 것을 다지는 데 집중하면 좋은 결과를 얻을 수 있습니다.";

  return <YearFortuneDetail chart={sampleChart} year={yearNum} summary={sampleSummary} />;
}

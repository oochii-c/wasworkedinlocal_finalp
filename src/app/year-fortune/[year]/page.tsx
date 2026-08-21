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
  const sampleSummary = "";

  return <YearFortuneDetail chart={sampleChart} year={yearNum} summary={sampleSummary} />;
}

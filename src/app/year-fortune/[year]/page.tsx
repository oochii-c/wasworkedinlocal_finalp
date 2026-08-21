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

  // 목업: 실제 LLM이 생성할 AI 총평/근거를 대신하는 하드코딩된 placeholder 텍스트다.
  const sampleSummary =
    "2026년 丙午는 일간 庚(금)과 조화를 이루는 해로, 전반적인 흐름이 안정적입니다. 1~3월과 10~12월에는 재물·직업 운이 정점을 찍어 이직이나 이사처럼 환경을 바꾸는 결정을 내리기에 좋은 시기입니다. 다만 4~5월과 8~9월에는 인간관계나 지출에서 마찰이 생기기 쉬우니 중요한 계약이나 큰 지출은 미루는 것이 좋습니다. 새로운 곳에 자리를 잡거나 이사를 계획하고 있다면 이 시기 안에 결정을 마무리하는 편이 유리합니다.";
  const sampleCitation = "세운 丙午 × 일간 庚金 오행 분포 반영";

  return (
    <YearFortuneDetail
      chart={sampleChart}
      year={yearNum}
      summary={sampleSummary}
      citation={sampleCitation}
    />
  );
}

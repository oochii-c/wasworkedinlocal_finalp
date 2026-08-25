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
  // 실제 AI 총평이 채워질 때는 summary와 citation(근거)이 항상 함께 와야 한다.
  // 구체적인 이사 길일 계산 로직은 이번 범위 밖이라, 여기서는 좋은 시기(월 단위)만
  // 언급하고 특정 날짜는 넣지 않는다.
  const sampleSummary =
    "2026년 丙午는 일간 庚(금)과 조화를 이루는 해로, 전반적인 흐름은 안정적이지만 영역별로는 뚜렷한 편차가 있습니다. 세운의 천간 丙(화)이 일간 庚(금)을 극하는 상극 관계라 한 해 전체의 기운이 강하게 부딪히는 흐름으로 해석되며, 사주 원국의 금 기운이 2개로 중간 수준이라 그 영향은 완충됩니다. 이 때문에 세운의 화 기운이 부각되는 1~3월과 10~12월에는 재물·직업 운이 정점을 찍어 이직이나 이사처럼 환경을 바꾸는 결정을 내리기에 좋은 시기입니다. 반대로 부딪힘이 커지는 4~5월과 8~9월에는 인간관계나 지출에서 마찰이 생기기 쉬우니 중요한 계약이나 큰 지출은 미루는 것이 좋습니다. 영역별로 보면 인간관계는 귀인이 등장할 만큼 힘을 받는 한 해라 주변의 도움을 적극적으로 받아들이는 편이 유리하고, 애정 역시 상반기에 좋은 인연이 들어올 가능성이 높아 새로운 만남에 마음을 열어두는 것이 좋습니다. 반면 총운과 재물은 숨 고르기와 지출 관리가 필요한 해이니 무리한 확장보다는 내실을 다지는 쪽에 무게를 두는 편이 안전하며, 건강도 컨디션 관리에 신경 쓰는 것이 좋습니다. 직업학업은 꾸준한 성과를 쌓아가는 흐름이라 큰 변화보다는 지금 하고 있는 일을 착실히 이어가는 것이 유리합니다. 새로운 곳에 자리를 잡거나 이사를 계획하고 있다면, 앞서 말한 1~3월과 10~12월 구간 안에 결정을 마무리하는 편이 유리합니다.";
  const sampleCitation = "세운 丙午 × 일간 庚金 오행 분포 반영";

  return (
    <YearFortuneDetail
      chart={sampleChart}
      year={yearNum}
      summary={sampleSummary}
      citation={sampleCitation || undefined}
    />
  );
}

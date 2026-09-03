import { useSaju } from "../../state/SajuContext";
import { YearFortuneDetail } from "./YearFortuneDetail";
import { useFortuneYear } from "./useFortuneYear";
import { useYearFortune } from "./useYearFortune";
import "../../styles/saju.css"; // --saju-* 토큰
import "../dashboard/dashboard.css"; // db-* 셸 클래스 재사용

export default function YearFortunePage() {
  // 폼에서 계산돼 context 에 평생 붙어있는 실제 원국을 그대로 쓴다.
  const { chart, inputs } = useSaju();
  const gender = inputs?.gender ?? "male";
  const yearNum = useFortuneYear(chart);
  // AI 총평(text)·요약(summary=올해 풀이)·영역 6개·월별 12개를 한 번의 호출로.
  const yf = useYearFortune(chart, yearNum, gender);

  if (!chart) return null; // Dashboard 가 보장하지만 타입 가드

  // 셸(db-page/topbar/db-main)은 Dashboard가 제공. 여기서는 본문만 반환한다.
  return (
    <YearFortuneDetail
      chart={chart}
      year={yearNum}
      gender={gender}
      summary={yf.text}
      yearSummary={yf.summary}
      domainTexts={yf.domains}
      monthTexts={yf.months}
      summaryLoading={yf.loading}
      summaryError={yf.error}
    />
  );
}

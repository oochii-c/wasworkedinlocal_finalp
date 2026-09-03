import { sampleChart } from "./saju/mock/sampleChart";
import { YearFortuneDetail } from "./YearFortuneDetail";
import { useFortuneYear } from "./useFortuneYear";
import { useYearFortune } from "./useYearFortune";
import "../../styles/saju.css"; // --saju-* 토큰
import "../dashboard/dashboard.css"; // db-* 셸 클래스 재사용

export default function YearFortunePage() {
  // 목업: 온보딩 폼이 아직 없어 sampleChart 를 원국으로 쓴다.
  const yearNum = useFortuneYear(sampleChart);
  // AI 총평은 실제 백엔드(POST /api/year-fortune)에서 받아온다.
  const { text, loading, error } = useYearFortune(sampleChart, yearNum);

  // 셸(db-page/topbar/db-main)은 Dashboard가 제공. 여기서는 본문만 반환한다.
  return (
    <YearFortuneDetail
      chart={sampleChart}
      year={yearNum}
      summary={text}
      summaryLoading={loading}
      summaryError={error}
    />
  );
}

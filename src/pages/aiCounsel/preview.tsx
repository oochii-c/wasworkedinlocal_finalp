// 프리뷰 전용 진입점 — App.tsx 를 건드리지 않고 이 페이지만 단독 렌더한다.
// dev 서버에서 /previewAiCounsel.html 로 접속하면 이 파일이 실행된다.
import { createRoot } from "react-dom/client";
import AiCounsel from "./AiCounsel";
import { type SajuExtended } from "../../saju";

// 필요한 전역 CSS 직접 로드 (토큰·폰트·대시보드 클래스)
import "../../styles/variables.css";
import "../../styles/base.css";
import "../../styles/saju.css"; // --saju-* 토큰 정의
import "../dashboard/dashboard.css"; // db-* 클래스 재사용

// 목업 원국 — 실제 계산기 형식에 맞춤(오행 키: 木火土金水, 십성: 5분류)
const mockChart = {
  dayGan: "己",
  baZi: ["己", "巳", "丁", "丑", "己", "亥", "乙", "亥"],
  shengXiao: "뱀",
  pillars: [],
  wuXingCount: { 木: 1, 火: 2, 土: 3, 金: 0, 水: 2 },
  shiShenCount: { 비겁: 2, 식상: 0, 재성: 3, 관성: 1, 인성: 1 },
  shenSha: [
    { name: "도화살", desc: "" },
    { name: "역마살", desc: "" },
    { name: "천을귀인", desc: "" },
  ],
  daYun: [{ ganZhi: "乙亥", startAge: 30, startYear: 2020 }],
  seWun: [],
  currentSeWun: { year: 2026, ganZhi: "丙午", rel: "상생(+2)", stars: 4 },
} as unknown as SajuExtended;

createRoot(document.getElementById("root")!).render(<AiCounsel chart={mockChart} name="홍길동" />);

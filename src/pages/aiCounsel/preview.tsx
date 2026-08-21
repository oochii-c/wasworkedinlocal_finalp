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

// 목업 원국 — 기능(C) 단계 전까지 화면 확인용
const mockChart = {
  dayGan: "己",
  baZi: ["己", "巳", "丁", "丑", "己", "亥", "乙", "亥"],
  shengXiao: "뱀",
  pillars: [],
  wuXingCount: { 목: 1, 화: 2, 토: 3, 금: 0, 수: 2 },
  shiShenCount: { 비견: 2, 편인: 1, 편관: 1 },
  shenSha: [],
  daYun: [{ ganZhi: "乙亥", startAge: 5, startYear: 1995 }],
  seWun: [],
  currentSeWun: { year: 2026, ganZhi: "丙午", rel: "상생(+2)", stars: 4 },
} as unknown as SajuExtended;

createRoot(document.getElementById("root")!).render(<AiCounsel chart={mockChart} name="홍길동" />);

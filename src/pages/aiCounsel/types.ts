// AI 용왕 상담 — 타입 정의
import { type SajuExtended } from "../../saju";

// 대화 메시지 한 건 (용왕 / 나)
export interface CounselMessage {
  role: "wang" | "me";
  text: string;
  src?: string; // 용왕 답변의 근거줄 (예: "세운 丙午 × 일간 己 상생(+2)")
}

// AiCounsel 페이지 props
// 원국(chart)은 부모가 주입(prop-driven) — 전역 상태 방식은 팀 논의 후 부모에서 연결
export interface AiCounselProps {
  chart: SajuExtended;
  name?: string;
  onBack?: () => void;
}

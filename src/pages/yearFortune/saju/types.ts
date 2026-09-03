export type CheonGan = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";
export type JiJi = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";

export interface GanZhi {
  gan: CheonGan;
  ji: JiJi;
}

// 원국은 폼에서 계산돼 SajuContext 에 실려오는 실제 확장 원국을 그대로 쓴다.
// (한자 일간·가중치 오행·십성·세운 배열 등을 모두 들고 있다.)
export type { SajuExtended } from "../../../saju";

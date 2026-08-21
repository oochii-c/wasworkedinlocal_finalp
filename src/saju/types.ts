export type CheonGan = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";
export type JiJi = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";

export interface GanZhi {
  gan: CheonGan;
  ji: JiJi;
}

export interface SajuExtended {
  birthDate: string;
  calendarType: "solar" | "lunar";
  gender: "M" | "F";
  pillars: {
    year: GanZhi;
    month: GanZhi;
    day: GanZhi;
    hour: GanZhi | null;
  };
  dayMaster: CheonGan;
  ohaeng: Record<"목" | "화" | "토" | "금" | "수", number>;
}

export interface SajuInput {
  gender: string;        // "male" | "female"
  calendarType: string;  // "solar" | "lunar" | "normal-month" | "leap-month"
  date: { year: number; month: number; day: number };
  time: { hour: number; minute: number };
  timeUnknown: boolean;
}

export interface Pillar {
  key: string;          // 연/월/일/시
  ganZhi: string;       // 간지
  gan: string;          // 천간
  zhi: string;          // 지지
  hideGan: string[];    // 지장간
  wuXing: string;       // 오행
  naYin: string;        // 납음
  shiShenGan: string;   // 십신(천간)
  shiShenZhi: string[]; // 십신(지지)
  diShi: string;        // 십이운성
  xunKong: string;      // 공망
}

export interface SajuChart {
  pillars: Pillar[];
  dayGan: string;   // 일간(나)
  baZi: string[];   // 8자
  shengXiao: string; // 띠
  dstApplied?: boolean;
  correctedSolar?: string;
}

export interface SeWunInfo {
  year: number;
  ganZhi: string;
  rel: string;
  stars: number;
}

export interface ShenShaInfo {
  name: string;
  hanja?: string;
  desc: string;
}

export interface DaYunInfo {
  ganZhi: string;
  startAge: number;
  startYear: number;
  endAge?: number;
  endYear?: number;
}

export interface SajuExtended extends SajuChart {
  wuXingCount: Record<string, number>;
  shiShenCount: Record<string, number>;
  shenSha: ShenShaInfo[];
  daYun: DaYunInfo[];
  seWun: SeWunInfo[];
  currentSeWun?: SeWunInfo;
  isForward?: boolean;
  daYunStart?: string;
}

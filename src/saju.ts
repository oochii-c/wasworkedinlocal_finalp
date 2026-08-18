import { Solar, Lunar } from "lunar-typescript";

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
}

const PILLAR_DEFS: [string, string][] = [
  ["연", "Year"],
  ["월", "Month"],
  ["일", "Day"],
  ["시", "Time"],
];

// 폼 입력을 lunar-typescript 원국(팔자)으로 계산.
// calendarType: solar=양력 / lunar·normal-month=음력 평달 / leap-month=음력 윤달
export function computeSaju(input: SajuInput): SajuChart {
  const { date, time, timeUnknown, calendarType } = input;
  const hour = timeUnknown ? 0 : time.hour;
  const minute = timeUnknown ? 0 : time.minute;

  let lunar: Lunar;
  if (calendarType === "solar") {
    lunar = Solar.fromYmdHms(date.year, date.month, date.day, hour, minute, 0).getLunar();
  } else {
    // lunar-typescript: 윤달은 월을 음수로 전달
    const month = calendarType === "leap-month" ? -date.month : date.month;
    lunar = Lunar.fromYmdHms(date.year, month, date.day, hour, minute, 0);
  }

  const ec = lunar.getEightChar() as unknown as Record<string, () => unknown>;
  const pillars: Pillar[] = PILLAR_DEFS.map(([ko, p]) => ({
    key: ko,
    ganZhi: ec[`get${p}`]() as string,
    gan: ec[`get${p}Gan`]() as string,
    zhi: ec[`get${p}Zhi`]() as string,
    hideGan: ec[`get${p}HideGan`]() as string[],
    wuXing: ec[`get${p}WuXing`]() as string,
    naYin: ec[`get${p}NaYin`]() as string,
    shiShenGan: ec[`get${p}ShiShenGan`]() as string,
    shiShenZhi: ec[`get${p}ShiShenZhi`]() as string[],
    diShi: ec[`get${p}DiShi`]() as string,
    xunKong: ec[`get${p}XunKong`]() as string,
  }));

  return {
    pillars,
    dayGan: lunar.getEightChar().getDayGan(),
    baZi: lunar.getBaZi(),
    shengXiao: lunar.getYearShengXiao(),
  };
}

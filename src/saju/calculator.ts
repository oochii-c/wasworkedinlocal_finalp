import { Solar, Lunar } from "lunar-typescript";
import { type SajuInput, type Pillar, type SajuChart, type SajuExtended } from "./types";
import { correctToSaju } from "./timeCorrection";
import { toTraditional, toTradArr } from "./hanja";
import { SIPSHEN_GROUP, calcShenSha } from "./shenSha";
import { GAN_TO_WUXING, calcFortuneFlow } from "./fortune";

export const PILLAR_DEFS: [string, string][] = [
  ["연", "Year"],
  ["월", "Month"],
  ["일", "Day"],
  ["시", "Time"],
];

/* ============================================================
   원국 사주 계산 (computeSaju)
   ============================================================ */
export function computeSaju(input: SajuInput): SajuChart {
  const { date, time, timeUnknown, calendarType } = input;

  let baseYear = date.year;
  let baseMonth = date.month;
  let baseDay = date.day;

  if (calendarType !== "solar") {
    // lunar-typescript: 윤달은 월을 음수로 전달
    const month = calendarType === "leap-month" ? -date.month : date.month;
    const lunarBase = Lunar.fromYmd(date.year, month, date.day);
    const s = lunarBase.getSolar();
    baseYear = s.getYear();
    baseMonth = s.getMonth();
    baseDay = s.getDay();
  }

  let finalYear = baseYear;
  let finalMonth = baseMonth;
  let finalDay = baseDay;
  let finalHour = 12; // 시간 모름일 경우 오시(12시) 기준
  let finalMinute = 0;
  let dstApplied = false;

  if (!timeUnknown) {
    const corr = correctToSaju(baseYear, baseMonth, baseDay, time.hour, time.minute);
    finalYear = corr.year;
    finalMonth = corr.month;
    finalDay = corr.day;
    finalHour = corr.hour;
    finalMinute = corr.minute;
    dstApplied = corr.dstApplied;
  }

  const solar = Solar.fromYmdHms(finalYear, finalMonth, finalDay, finalHour, finalMinute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar() as unknown as Record<string, () => unknown>;

  const pillars: Pillar[] = PILLAR_DEFS.map(([ko, p]) => ({
    key: ko,
    ganZhi: ec[`get${p}`]() as string,
    gan: ec[`get${p}Gan`]() as string,
    zhi: ec[`get${p}Zhi`]() as string,
    hideGan: (ec[`get${p}HideGan`]() as string[]) || [],
    wuXing: ec[`get${p}WuXing`]() as string,
    naYin: toTraditional(ec[`get${p}NaYin`]() as string),
    shiShenGan: toTraditional(ec[`get${p}ShiShenGan`]() as string),
    shiShenZhi: toTradArr((ec[`get${p}ShiShenZhi`]() as string[]) || []),
    diShi: ec[`get${p}DiShi`]() as string,
    xunKong: ec[`get${p}XunKong`]() as string,
  }));

  return {
    pillars,
    dayGan: lunar.getEightChar().getDayGan(),
    baZi: lunar.getBaZi(),
    shengXiao: lunar.getYearShengXiao(),
    dstApplied,
    correctedSolar: solar.toYmdHms(),
  };
}

/* ============================================================
   대시보드 확장 계산 (computeSajuExtended)
   ============================================================ */
export function computeSajuExtended(input: SajuInput): SajuExtended {
  const base = computeSaju(input);

  // 오행 집계 (원국 8자 + 지장간)
  const wuXingCount: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  // 1. 원국 8자 오행 (천간 + 지지)
  for (const p of base.pillars) {
    for (const ch of p.wuXing) {
      if (ch in wuXingCount) wuXingCount[ch]++;
    }
  }
  // 2. 지장간 오행
  for (const p of base.pillars) {
    for (const gan of p.hideGan) {
      const wx = GAN_TO_WUXING[gan];
      if (wx && wx in wuXingCount) wuXingCount[wx]++;
    }
  }

  // 십성 집계 (5분류)
  const shiShenCount: Record<string, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const p of base.pillars) {
    const g = SIPSHEN_GROUP[p.shiShenGan];
    if (g) shiShenCount[g]++;
    for (const z of p.shiShenZhi) {
      const gz = SIPSHEN_GROUP[z];
      if (gz) shiShenCount[gz]++;
    }
  }

  const shenSha = calcShenSha(base.pillars, base.dayGan);
  const fortune = calcFortuneFlow(input, base.dayGan);

  return {
    ...base,
    wuXingCount,
    shiShenCount,
    shenSha,
    ...fortune,
  };
}

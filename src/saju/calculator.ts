import { Solar, Lunar } from "lunar-typescript";
import { type SajuInput, type Pillar, type SajuChart, type SajuExtended } from "./types";
import { correctToSaju } from "./timeCorrection";
import { toTraditional, toTradArr } from "./hanja";
import { SIPSHEN_GROUP, calcShenSha } from "./shenSha";
import { GAN_TO_WUXING, HIDE_GAN_WEIGHT, MONTH_BRANCH_WEIGHT, calcFortuneFlow } from "./fortune";

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

  // 오행 집계 (원국 8자 + 지장간). 개수가 아니라 가중 점수라 소수가 나온다.
  // 천간 1.0 / 지지 1.0 / 지지의 지장간 합 1.0, 월지 계열만 MONTH_BRANCH_WEIGHT 배.
  // 총합은 사주와 무관하게 상수(월지 ×2 기준 14.0)라 오행 점유율을 사주 간에 비교할 수 있다.
  const wuXingCount: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of base.pillars) {
    const mul = p.key === "월" ? MONTH_BRANCH_WEIGHT : 1;
    // p.wuXing 은 "木火" 꼴 2글자 — 앞이 천간 오행, 뒤가 지지 오행
    const [ganWx, zhiWx] = p.wuXing;
    if (ganWx in wuXingCount) wuXingCount[ganWx] += 1;
    if (zhiWx in wuXingCount) wuXingCount[zhiWx] += mul;

    const weights = HIDE_GAN_WEIGHT[p.zhi] || [];
    p.hideGan.forEach((gan, i) => {
      const wx = GAN_TO_WUXING[gan];
      // 가중치 표에 없는 자리는 0 — 표와 라이브러리가 어긋나도 총합만 줄지 값이 튀지 않는다.
      if (wx && wx in wuXingCount) wuXingCount[wx] += (weights[i] ?? 0) * mul;
    });
  }
  // 부동소수 누적 오차 정리 (0.30000000000000004 방지)
  for (const k of Object.keys(wuXingCount)) {
    wuXingCount[k] = Math.round(wuXingCount[k] * 100) / 100;
  }

  // 십성 집계 (5분류)
  const shiShenCount: Record<string, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const p of base.pillars) {
    // 일간 자신(日主)은 세지 않는다. 모든 사주에 무조건 붙는 비겁 +1이라
    // 비겁만 평균 26%로 뜨고(나머지 18%대) "비겁 없는 사주"가 아예 못 나왔다.
    // 빼면 다섯 분류가 19.8~20.1%로 균등선에 붙는다.
    const g = p.shiShenGan === "日主" ? undefined : SIPSHEN_GROUP[p.shiShenGan];
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

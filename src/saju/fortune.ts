import { Solar, Lunar, EightChar } from "lunar-typescript";
import { type SajuInput, type DaYunInfo, type SeWunInfo } from "./types";
import { correctToSaju } from "./timeCorrection";

/* ============================================================
   대운(大運), 세운(歲運) 및 상생상극 별점 계산
   ============================================================ */
export const GAN_LIST = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const ZHI_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const WUXING_ORDER = ["木", "火", "土", "金", "水"];

export const GAN_TO_WUXING: Record<string, string> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
};

export function seWunScore(yearGan: string, dayGan: string): { rel: string; stars: number } {
  const yw = GAN_TO_WUXING[yearGan], dw = GAN_TO_WUXING[dayGan];
  if (!yw || !dw) return { rel: "?", stars: 3 };
  if (yw === dw) return { rel: "비화", stars: 3 };
  const yi = WUXING_ORDER.indexOf(yw), di = WUXING_ORDER.indexOf(dw);
  if ((yi + 1) % 5 === di) return { rel: "상생(+2)", stars: 5 }; // 세운이 일간을 생함
  if ((yi + 2) % 5 === di) return { rel: "상극(-2)", stars: 1 }; // 세운이 일간을 극함
  if ((di + 1) % 5 === yi) return { rel: "상기(+1)", stars: 4 }; // 일간이 세운을 생함
  return { rel: "상성(+1)", stars: 4 };                          // 일간이 세운을 극함
}

export function calcFortuneFlow(input: SajuInput, dayGan: string): {
  daYun: DaYunInfo[];
  seWun: SeWunInfo[];
  currentSeWun: SeWunInfo;
  isForward: boolean;
  daYunStart: string;
} {
  let daYun: DaYunInfo[] = [];
  let seWun: SeWunInfo[] = [];
  let isForward = true;
  let daYunStart = "";

  try {
    const hour = input.timeUnknown ? 12 : input.time.hour;
    const minute = input.timeUnknown ? 0 : input.time.minute;
    const corr = input.timeUnknown
      ? { year: input.date.year, month: input.date.month, day: input.date.day, hour: 12, minute: 0 }
      : correctToSaju(input.date.year, input.date.month, input.date.day, hour, minute);

    let solar: Solar;
    if (input.calendarType === "solar") {
      solar = Solar.fromYmdHms(corr.year, corr.month, corr.day, corr.hour, corr.minute, 0);
    } else {
      const month = input.calendarType === "leap-month" ? -input.date.month : input.date.month;
      const lb = Lunar.fromYmd(input.date.year, month, input.date.day);
      const s = lb.getSolar();
      solar = Solar.fromYmdHms(s.getYear(), s.getMonth(), s.getDay(), corr.hour, corr.minute, 0);
    }

    const ec = EightChar.fromLunar(solar.getLunar());
    const genderNum = input.gender === "male" ? 1 : 0;
    const yun = ec.getYun(genderNum);
    isForward = yun.isForward();
    daYunStart = yun.getStartSolar().toYmd();

    const dyList = yun.getDaYun(8);
    daYun = dyList.map(dy => ({
      ganZhi: dy.getGanZhi(),
      startAge: dy.getStartAge(),
      startYear: dy.getStartYear(),
      endAge: dy.getEndAge(),
      endYear: dy.getEndYear(),
    }));

    // 세운 목록 생성
    seWun = daYun.flatMap(dy => {
      const startY = dy.startYear;
      const endY = dy.endYear || startY + 9;
      return Array.from({ length: endY - startY + 1 }, (_, i) => {
        const y = startY + i;
        const gz = GAN_LIST[(y - 4 + 4000) % 10] + ZHI_LIST[(y - 4 + 4800) % 12];
        return {
          year: y,
          ganZhi: gz,
          ...seWunScore(gz[0], dayGan),
        };
      });
    });
  } catch (e) {
    console.error("대운/세운 계산 실패:", e);
  }

  // 현재 연도(2026년 등) 세운 정보
  const currentYear = new Date().getFullYear();
  const currentSeWun = seWun.find(sw => sw.year === currentYear) || (() => {
    const gz = GAN_LIST[(currentYear - 4 + 4000) % 10] + ZHI_LIST[(currentYear - 4 + 4800) % 12];
    return { year: currentYear, ganZhi: gz, ...seWunScore(gz[0], dayGan) };
  })();

  return {
    daYun,
    seWun,
    currentSeWun,
    isForward,
    daYunStart,
  };
}

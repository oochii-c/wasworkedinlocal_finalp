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

// 지장간 가중치 — lunar-typescript getXxxHideGan() 반환 순서에 1:1 대응하며, 지지마다 합이 1.0이다.
// 값은 지장간 일수(30일 기준) 비율에서 왔다. 본기 > 중기 ≥ 여기.
// 평면 카운트(지장간 1개당 1점)를 쓰면 지지가 품은 지장간 개수(1~3개)만큼 그 지지의
// 발언권이 커져, 원국 총합이 사주마다 14~20으로 흔들리고 오행 점유율을 사주 간에
// 비교할 수 없게 된다. 합을 1.0으로 고정하면 지지 1개의 기여가 항상 같아진다.
// 午·亥는 lunar 가 여기(丙·戊)를 빼고 주므로, 남은 지장간끼리 재정규화한 값이다.
export const HIDE_GAN_WEIGHT: Record<string, number[]> = {
  子: [1.0],                 // 癸
  丑: [0.60, 0.30, 0.10],    // 己(본18) 癸(여9) 辛(중3)
  寅: [0.54, 0.23, 0.23],    // 甲(본16) 丙(중7) 戊(여7)
  卯: [1.0],                 // 乙
  辰: [0.60, 0.30, 0.10],    // 戊(본18) 乙(여9) 癸(중3)
  巳: [0.54, 0.23, 0.23],    // 丙(본16) 庚(중7) 戊(여7)
  午: [0.57, 0.43],          // 丁(본12) 己(중9)
  未: [0.60, 0.30, 0.10],    // 己(본18) 丁(여9) 乙(중3)
  申: [0.54, 0.23, 0.23],    // 庚(본16) 壬(중7) 戊(여7)
  酉: [1.0],                 // 辛
  戌: [0.60, 0.30, 0.10],    // 戊(본18) 辛(여9) 丁(중3)
  亥: [0.70, 0.30],          // 壬(본16) 甲(중7)
};

// 월지(月支)는 오행 강약의 최대 결정 요인이라, 지지 오행·지장간 모두에 이 배수를 곱한다.
// 천간은 대상이 아니다.
export const MONTH_BRANCH_WEIGHT = 2.0;

// 일간(나) 대비 다른 천간의 십성을 5분류(비겁·식상·재성·관성·인성)로 돌려준다.
// 정편(正偏) 구분은 하지 않는다 — 영역 점수화엔 5분류면 충분하다.
// 방향: 오행 생극에서 木→火→土→金→水(생), 木→土→水→火→金(극).
export function tenGodGroup(
  dayGan: string,
  otherGan: string,
): "비겁" | "식상" | "재성" | "관성" | "인성" {
  const dw = GAN_TO_WUXING[dayGan];
  const ow = GAN_TO_WUXING[otherGan];
  if (!dw || !ow) return "비겁";
  const di = WUXING_ORDER.indexOf(dw);
  const oi = WUXING_ORDER.indexOf(ow);
  if (di === oi) return "비겁"; // 같은 오행
  if ((di + 1) % 5 === oi) return "식상"; // 내가 생함
  if ((di + 2) % 5 === oi) return "재성"; // 내가 극함
  if ((di + 3) % 5 === oi) return "관성"; // 나를 극함
  return "인성"; // 나를 생함
}

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

    const dyList = yun.getDaYun(10);
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

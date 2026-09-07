import { CheonGan, JiJi, GanZhi, SajuExtended } from "./types";

export type Ohaeng = "목" | "화" | "토" | "금" | "수";
export type ElementRelation = "generates" | "generated_by" | "controls" | "controlled_by" | "same";

export const CHEON_GAN: readonly CheonGan[] = [
  "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계",
] as const;

export const JI_JI: readonly JiJi[] = [
  "자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해",
] as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function getYearGanZhi(year: number): GanZhi {
  const stemIndex = mod(year - 4, 10);
  const branchIndex = mod(year - 4, 12);
  return { gan: CHEON_GAN[stemIndex], ji: JI_JI[branchIndex] };
}

export function getChartYearRange(chart: SajuExtended): { min: number; max: number } {
  // 실제 원국이 들고 있는 세운(대운에서 펼친 연도 목록)의 양 끝을 범위로 쓴다.
  const years = (chart.seWun ?? []).map((s) => s.year);
  if (years.length === 0) {
    const now = new Date().getFullYear();
    return { min: now, max: now + 100 };
  }
  return { min: years[0], max: years[years.length - 1] };
}

export const CHEON_GAN_HANJA: Record<CheonGan, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

export const JI_JI_HANJA: Record<JiJi, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

// 실제 원국·lunar-typescript 는 한자를 주므로 되돌리는 표도 둔다.
export const HANJA_TO_CHEON_GAN = Object.fromEntries(
  Object.entries(CHEON_GAN_HANJA).map(([k, v]) => [v, k]),
) as Record<string, CheonGan>;

export const HANJA_TO_JI_JI = Object.fromEntries(
  Object.entries(JI_JI_HANJA).map(([k, v]) => [v, k]),
) as Record<string, JiJi>;

// 한자 오행("木") ↔ 한글 오행("목"). getOhaengRelation 은 한글 오행을 받는다.
export const HANJA_ELEM_TO_KOR: Record<string, Ohaeng> = {
  木: "목", 火: "화", 土: "토", 金: "금", 水: "수",
};

// 한자 일간("庚") → 한글 오행("금")
export function ohaengOfHanjaGan(hanjaGan: string): Ohaeng {
  return GAN_TO_OHAENG[HANJA_TO_CHEON_GAN[hanjaGan]];
}

export const GAN_TO_OHAENG: Record<CheonGan, Ohaeng> = {
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금", 신: "금",
  임: "수", 계: "수",
};

const GENERATES: Record<Ohaeng, Ohaeng> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};

const CONTROLS: Record<Ohaeng, Ohaeng> = {
  목: "토", 토: "수", 수: "화", 화: "금", 금: "목",
};

export function getOhaengRelation(a: Ohaeng, b: Ohaeng): ElementRelation {
  if (a === b) return "same";
  if (GENERATES[a] === b) return "generates";
  if (CONTROLS[a] === b) return "controls";
  if (GENERATES[b] === a) return "generated_by";
  return "controlled_by";
}

export function getElementRelation(ganA: CheonGan, ganB: CheonGan): ElementRelation {
  return getOhaengRelation(GAN_TO_OHAENG[ganA], GAN_TO_OHAENG[ganB]);
}

export function ganZhiToHanja(gz: GanZhi): string {
  return `${CHEON_GAN_HANJA[gz.gan]}${JI_JI_HANJA[gz.ji]}`;
}

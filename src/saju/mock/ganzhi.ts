import { CheonGan, JiJi, GanZhi } from "../types";

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

// 목업: 실제 절기(24절기) 기반 계산이 아니라, 연간지에서 파생한 결정론적 더미값이다.
// TODO: 실제 사주 라이브러리(절기 기반 월주 계산)로 교체할 것.
export function getMonthInGanZhi(year: number, month: number): GanZhi {
  if (month < 1 || month > 12) {
    throw new Error(`month must be between 1 and 12, got ${month}`);
  }
  const yearStemIndex = CHEON_GAN.indexOf(getYearGanZhi(year).gan);
  const stemIndex = mod(yearStemIndex * 2 + month, 10);
  const branchIndex = mod(month + 1, 12);
  return { gan: CHEON_GAN[stemIndex], ji: JI_JI[branchIndex] };
}

export const CHEON_GAN_HANJA: Record<CheonGan, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

export const JI_JI_HANJA: Record<JiJi, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

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

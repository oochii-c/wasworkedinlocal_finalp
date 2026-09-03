// 영역별/월별 점수화. 실제 원국(한자 일간·가중치 오행·십성)과 세운/월운 천간의
// 십성·오행 관계를 근거로 1~5점을 낸다.
import type { SajuExtended } from "./types";
import { tenGodGroup, GAN_TO_WUXING } from "../../../saju/fortune";
import {
  CHEON_GAN_HANJA,
  HANJA_ELEM_TO_KOR,
  GAN_TO_OHAENG,
  ohaengOfHanjaGan,
  getYearGanZhi,
  getOhaengRelation,
  type Ohaeng,
  type ElementRelation,
} from "./ganzhi";
import { getMonthInGanZhi } from "./monthGanzhi";

export type Domain = "총운" | "애정" | "재물" | "직업" | "학업" | "건강" | "인간관계";

// 총운을 포함한 전체(점수 계산용). 총운은 화면 아래 AI 총평/올해 풀이로 따로 보여준다.
export const DOMAINS: readonly Domain[] = [
  "총운", "애정", "재물", "직업", "학업", "건강", "인간관계",
] as const;

// 영역별 격자에 실제로 그리는 6개. 배열 순서 = 화면 표시 순서.
export const GRID_DOMAINS: readonly Exclude<Domain, "총운">[] = [
  "건강", "애정", "인간관계", "재물", "직업", "학업",
] as const;

type TenGod = "비겁" | "식상" | "재성" | "관성" | "인성";

// 세운/월운 천간 오행이 기준 오행(일간 또는 영역 오행)에 미치는 영향의 기본점.
const RELATION_SCORE: Record<ElementRelation, number> = {
  generates: 5,      // 생조
  same: 4,           // 비화
  controlled_by: 3,  // 기준이 세운을 다스림
  generated_by: 2,   // 기준이 세운에 기운을 내어줌(설기)
  controls: 1,       // 세운이 기준을 극함
};

// 일간 오행 기준, 십성 그룹이 대응하는 오행(한자). 木火土金水 순환에서
// 비겁=나, 식상=내가 생, 재성=내가 극, 관성=나를 극, 인성=나를 생.
const WX_ORDER = ["木", "火", "土", "金", "水"];
const TEN_GOD_STEP: Record<TenGod, number> = { 비겁: 0, 식상: 1, 재성: 2, 관성: 3, 인성: 4 };

function elementOfTenGod(dayGan: string, tg: TenGod): string {
  const di = WX_ORDER.indexOf(GAN_TO_WUXING[dayGan]);
  if (di < 0) return "木";
  return WX_ORDER[(di + TEN_GOD_STEP[tg]) % 5];
}

// 각 영역이 대표하는 십성(primary) + 순기능/역기능 십성.
// 애정은 성별에 따라 배우자 십성이 갈린다(남 재성 / 여 관성).
function favorOf(
  domain: Exclude<Domain, "총운">,
  gender: string,
): { good: TenGod[]; bad: TenGod[]; primary: TenGod } {
  switch (domain) {
    case "애정":
      return gender === "female"
        ? { good: ["관성"], bad: [], primary: "관성" }
        : { good: ["재성"], bad: [], primary: "재성" };
    case "재물":
      return { good: ["재성"], bad: ["비겁"], primary: "재성" };
    case "직업":
      return { good: ["관성"], bad: ["식상"], primary: "관성" }; // 상관견관
    case "학업":
      return { good: ["인성"], bad: ["재성"], primary: "인성" }; // 재극인
    case "인간관계":
      return { good: ["비겁"], bad: [], primary: "비겁" };
    case "건강":
      return { good: ["인성"], bad: ["식상", "관성"], primary: "인성" };
  }
}

const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

export function computeDomainScores(
  chart: SajuExtended,
  year: number,
  gender: string,
): Record<Domain, number> {
  const yg = getYearGanZhi(year);
  const yearGanHanja = CHEON_GAN_HANJA[yg.gan];
  const yearElem: Ohaeng = GAN_TO_OHAENG[yg.gan];
  const seTenGod = tenGodGroup(chart.dayGan, yearGanHanja);

  const total = Object.values(chart.wuXingCount).reduce((a, b) => a + b, 0) || 1;
  const scores = {} as Record<Domain, number>;

  // 총운 — 세운 오행 ↔ 일간 오행 관계에, 세운 십성의 길흉을 얹는다.
  {
    let s = RELATION_SCORE[getOhaengRelation(yearElem, ohaengOfHanjaGan(chart.dayGan))];
    if (seTenGod === "인성" || seTenGod === "재성") s += 1;
    if (seTenGod === "식상") s -= 1;
    scores["총운"] = clamp(s);
  }

  for (const domain of GRID_DOMAINS) {
    const favor = favorOf(domain, gender);
    const elemHanja = elementOfTenGod(chart.dayGan, favor.primary);
    let s = RELATION_SCORE[getOhaengRelation(yearElem, HANJA_ELEM_TO_KOR[elemHanja])];

    if (favor.good.includes(seTenGod)) s += 2;
    if (favor.bad.includes(seTenGod)) s -= 2;

    // 인간관계는 원국 비겁이 과다하면 협력보다 경쟁으로 기운다.
    if (domain === "인간관계" && (chart.shiShenCount["비겁"] ?? 0) >= 4) s -= 1;

    // 원국에서 그 영역 오행이 두터우면 +, 비면 −.
    const share = (chart.wuXingCount[elemHanja] ?? 0) / total;
    if (share >= 0.28) s += 1;
    else if (share <= 0.08) s -= 1;

    scores[domain] = clamp(s);
  }

  return scores;
}

export function computeOverallScore(scores: Record<Domain, number>): number {
  const values = GRID_DOMAINS.map((d) => scores[d]);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return clamp(avg);
}

export function computeMonthlyScores(chart: SajuExtended, year: number): number[] {
  const dayElem = ohaengOfHanjaGan(chart.dayGan);
  const out: number[] = [];
  for (let month = 1; month <= 12; month++) {
    const mgz = getMonthInGanZhi(year, month);
    let s = RELATION_SCORE[getOhaengRelation(GAN_TO_OHAENG[mgz.gan], dayElem)];
    const tg = tenGodGroup(chart.dayGan, CHEON_GAN_HANJA[mgz.gan]);
    if (tg === "인성" || tg === "재성") s += 1;
    if (tg === "식상") s -= 1;
    out.push(clamp(s));
  }
  return out;
}

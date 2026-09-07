// 주제별 별점을 원국의 십성(十神) 분포로 결정론적으로 산출한다.
// (올해 영역별 점수와 같은 취지 — LLM 판단이 아니라 원국 근거의 휴리스틱.)
import type { SajuExtended } from "../../saju";

export type ThemeKey = "love" | "wealth" | "health" | "business" | "study" | "relations";

type TenGod = "비겁" | "식상" | "재성" | "관성" | "인성";

// 각 주제가 기대는 십성 — 원국에 두터울수록 그 주제의 그릇이 크다.
// 애정은 배우자성이라 성별로 갈린다(남 재성=아내 / 여 관성=남편).
const THEME_GODS: Record<Exclude<ThemeKey, "love">, TenGod[]> = {
  wealth: ["재성"],
  business: ["재성", "식상"], // 식상생재
  study: ["인성"],
  relations: ["비겁"],
  health: ["인성", "비겁"], // 나를 돕고 지키는 힘(신강도)
};

// 십성 1분류당 평균 점유율 → 1~5. 균등 분포(각 20%)면 3점.
function starsFromShare(sum: number, godCount: number): number {
  const t = sum / godCount;
  if (t >= 0.3) return 5;
  if (t >= 0.24) return 4;
  if (t >= 0.15) return 3;
  if (t >= 0.08) return 2;
  return 1;
}

export function computeThemeScores(
  chart: SajuExtended,
  gender: string,
): Record<ThemeKey, number> {
  const ss = chart.shiShenCount;
  const total = Object.values(ss).reduce((a, b) => a + b, 0) || 1;
  const scoreFor = (gods: TenGod[]) =>
    starsFromShare(gods.reduce((s, g) => s + (ss[g] ?? 0), 0) / total, gods.length);

  return {
    love: scoreFor(gender === "female" ? ["관성"] : ["재성"]),
    wealth: scoreFor(THEME_GODS.wealth),
    health: scoreFor(THEME_GODS.health),
    business: scoreFor(THEME_GODS.business),
    study: scoreFor(THEME_GODS.study),
    relations: scoreFor(THEME_GODS.relations),
  };
}

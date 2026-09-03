import { Domain, GRID_DOMAINS } from "../saju/scoring";
import { getDomainCaption, getDomainInterpretation, scoreColor } from "../saju/insights";
import { IconAccordion, type IconAccordionItem } from "../../../components/IconAccordion";

import iconAe from "../../../assets/icons/06_compatibility.svg";
import iconJae from "../../../assets/icons/04_wealth.svg";
import iconIn from "../../../assets/icons/05_fate-path.svg";
import iconHak from "../../../assets/icons/08_deep-analysis.svg";
import iconGeon from "../../../assets/icons/02_todays-fortune-core.svg";
import iconJik from "../../../assets/icons/03_five-elements.svg";

const DOMAIN_ICON: Record<Exclude<Domain, "총운">, string> = {
  애정: iconAe,
  재물: iconJae,
  직업: iconJik,
  학업: iconHak,
  건강: iconGeon,
  인간관계: iconIn,
};

// Figma 내보내기라 축소 보정이 필요한 아이콘
const FIG = new Set<string>(["건강", "인간관계"]);

export interface DomainStarsProps {
  scores: Record<Domain, number>;
  descriptions?: Partial<Record<Domain, string>> | null;
  dayGanHanja: string;
  year: number;
}

export function DomainStars({ scores, descriptions, dayGanHanja, year }: DomainStarsProps) {
  const items: IconAccordionItem[] = GRID_DOMAINS.map((d) => ({
    key: d,
    label: d,
    icon: DOMAIN_ICON[d],
    score: scores[d],
    caption: getDomainCaption(d, scores[d]),
    figIcon: FIG.has(d),
  }));

  return (
    <IconAccordion
      ariaLabel="영역별 풀이"
      items={items}
      colorFor={scoreColor}
      renderPanel={(key) =>
        descriptions?.[key as Domain] || getDomainInterpretation(key as Domain, dayGanHanja, year)
      }
    />
  );
}

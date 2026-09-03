import { useState } from "react";
import { Domain, GRID_DOMAINS } from "../saju/scoring";
import { getDomainCaption, getDomainInterpretation, scoreColor } from "../saju/insights";
import styles from "./DomainStars.module.css";

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

export interface DomainStarsProps {
  scores: Record<Domain, number>;
  descriptions?: Partial<Record<Domain, string>> | null;
  dayGanHanja: string;
  year: number;
}

export function DomainStars({ scores, descriptions, dayGanHanja, year }: DomainStarsProps) {
  // 한 번에 하나만 펼친다. 기본은 아이콘만, 클릭하면 제목 + 상세 박스가 열린다.
  const [open, setOpen] = useState<Domain | null>(null);

  return (
    <section className={styles.wrap} aria-label="영역별 풀이">
      <div className={styles.row} role="tablist">
        {GRID_DOMAINS.map((domain) => {
          const isOpen = open === domain;
          return (
            <button
              key={domain}
              type="button"
              role="tab"
              aria-selected={isOpen}
              className={`${styles.tab}${isOpen ? ` ${styles.tabActive}` : ""}`}
              onClick={() => setOpen((cur) => (cur === domain ? null : domain))}
            >
              <span
                className={styles.icon}
                data-domain={domain}
                aria-hidden="true"
                style={{
                  maskImage: `url(${DOMAIN_ICON[domain]})`,
                  WebkitMaskImage: `url(${DOMAIN_ICON[domain]})`,
                  // 기본은 중립색, 누른(펼친) 아이콘만 점수 색으로.
                  backgroundColor: isOpen ? scoreColor(scores[domain]) : "#B8CEE0",
                }}
              />
              <span className={styles.tabLabel}>{domain}</span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>{getDomainCaption(open, scores[open])}</span>
          </div>
          <p className={styles.panelText}>
            {descriptions?.[open] || getDomainInterpretation(open, dayGanHanja, year)}
          </p>
        </div>
      )}
    </section>
  );
}

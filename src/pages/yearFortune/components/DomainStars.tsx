
import { useState } from "react";
import { SajuExtended } from "../saju/types";
import { Domain, DOMAINS } from "../saju/mock/scoring";
import { getDomainCaption, getDomainInterpretation } from "../saju/mock/insights";
import { StarRating } from "./StarRating";
import styles from "./DomainStars.module.css";

export interface DomainStarsProps {
  scores: Record<Domain, number>;
  chart: SajuExtended;
  year: number;
}

export function DomainStars({ scores, chart, year }: DomainStarsProps) {
  const [openDomain, setOpenDomain] = useState<Domain | null>(null);

  return (
    <section className={styles.grid} aria-label="영역별 별점">
      {DOMAINS.map((domain) => (
        <div key={domain} className={styles.cell}>
          <div className={styles.header}>
            <span className={styles.label}>{domain}</span>
            <button
              type="button"
              className={styles.infoButton}
              aria-label={`${domain} 설명 보기`}
              onClick={() => setOpenDomain((prev) => (prev === domain ? null : domain))}
            >
              ?
            </button>
          </div>
          {openDomain === domain && (
            <span className={styles.description}>{getDomainInterpretation(domain, chart, year)}</span>
          )}
          <StarRating score={scores[domain]} />
          <span className={styles.caption}>{getDomainCaption(domain, scores[domain])}</span>
        </div>
      ))}
    </section>
  );
}

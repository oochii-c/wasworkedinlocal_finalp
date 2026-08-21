import { Domain, DOMAINS } from "@/saju/mock/scoring";
import { getDomainCaption } from "@/saju/mock/insights";
import { StarRating } from "./StarRating";
import styles from "./DomainStars.module.css";

export interface DomainStarsProps {
  scores: Record<Domain, number>;
}

export function DomainStars({ scores }: DomainStarsProps) {
  return (
    <section className={styles.grid} aria-label="영역별 별점">
      {DOMAINS.map((domain) => (
        <div key={domain} className={styles.cell}>
          <span className={styles.label}>{domain}</span>
          <StarRating score={scores[domain]} />
          <span className={styles.caption}>{getDomainCaption(domain, scores[domain])}</span>
        </div>
      ))}
    </section>
  );
}

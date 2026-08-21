import { Domain, DOMAINS } from "@/saju/mock/scoring";
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
        </div>
      ))}
    </section>
  );
}

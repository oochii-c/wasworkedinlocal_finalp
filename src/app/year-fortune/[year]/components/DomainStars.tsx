import { Domain } from "@/saju/mock/scoring";
import { StarRating } from "./StarRating";
import styles from "./DomainStars.module.css";

export interface DomainStarsProps {
  scores: Record<Domain, number>;
}

const DOMAIN_ORDER: Domain[] = ["총운", "애정", "재물", "직업학업", "건강", "인간관계"];

export function DomainStars({ scores }: DomainStarsProps) {
  return (
    <section className={styles.grid} aria-label="영역별 별점">
      {DOMAIN_ORDER.map((domain) => (
        <div key={domain} className={styles.cell}>
          <span className={styles.label}>{domain}</span>
          <StarRating score={scores[domain]} />
        </div>
      ))}
    </section>
  );
}

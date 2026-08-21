import styles from "./GoodBadMonths.module.css";

export interface GoodBadMonthsProps {
  monthlyScores: number[];
}

export function GoodBadMonths({ monthlyScores }: GoodBadMonthsProps) {
  const pickMonth = monthlyScores.indexOf(Math.max(...monthlyScores)) + 1;
  const cautionMonth = monthlyScores.indexOf(Math.min(...monthlyScores)) + 1;

  return (
    <section className={styles.section} aria-label="좋은/주의 시기">
      <div className={styles.callout}>
        <span className={styles.badgeGood}>추천</span>
        <span>{pickMonth}월</span>
      </div>
      <div className={styles.callout}>
        <span className={styles.badgeCaution}>주의</span>
        <span>{cautionMonth}월</span>
      </div>
    </section>
  );
}

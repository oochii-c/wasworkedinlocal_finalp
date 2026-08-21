import {
  getGoodMonths,
  getCautionMonths,
  formatMonthRanges,
  GOOD_PERIOD_CAPTION,
  CAUTION_PERIOD_CAPTION,
} from "@/saju/mock/insights";
import styles from "./GoodBadMonths.module.css";

export interface GoodBadMonthsProps {
  monthlyScores: number[];
}

export function GoodBadMonths({ monthlyScores }: GoodBadMonthsProps) {
  const goodRange = formatMonthRanges(getGoodMonths(monthlyScores));
  const cautionRange = formatMonthRanges(getCautionMonths(monthlyScores));

  return (
    <section className={styles.section} aria-label="좋은/주의 시기">
      <div className={`${styles.callout} ${styles.calloutGood}`}>
        <div className={styles.calloutTitle}>
          <span aria-hidden="true">✨</span> 좋은 시기
        </div>
        <div className={styles.range}>{goodRange}</div>
        <div className={styles.caption}>{GOOD_PERIOD_CAPTION}</div>
      </div>
      <div className={`${styles.callout} ${styles.calloutCaution}`}>
        <div className={styles.calloutTitle}>
          <span aria-hidden="true">⚠️</span> 주의 시기
        </div>
        <div className={styles.range}>{cautionRange}</div>
        <div className={styles.caption}>{CAUTION_PERIOD_CAPTION}</div>
      </div>
    </section>
  );
}

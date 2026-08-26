import { GanZhi } from "../saju/types";
import { ganZhiToHanja } from "../saju/ganzhi";
import { StarRating } from "./StarRating";
import styles from "./YearNav.module.css";

export interface YearNavProps {
  year: number;
  yearGanZhi: GanZhi;
  overallScore: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onNavigate: (year: number) => void;
}

export function YearNav({ year, yearGanZhi, overallScore, canGoPrev, canGoNext, onNavigate }: YearNavProps) {
  return (
    <nav className={styles.nav} aria-label="연도 이동">
      {canGoPrev ? (
        <button type="button" onClick={() => onNavigate(year - 1)} className={styles.arrow} aria-label="이전 해">
          ‹
        </button>
      ) : (
        <span className={`${styles.arrow} ${styles.arrowDisabled}`} aria-hidden="true">
          ‹
        </span>
      )}
      <div className={styles.title}>
        <span className={styles.year}>
          {year}년 {ganZhiToHanja(yearGanZhi)}
        </span>
        <StarRating score={overallScore} />
      </div>
      {canGoNext ? (
        <button type="button" onClick={() => onNavigate(year + 1)} className={styles.arrow} aria-label="다음 해">
          ›
        </button>
      ) : (
        <span className={`${styles.arrow} ${styles.arrowDisabled}`} aria-hidden="true">
          ›
        </span>
      )}
    </nav>
  );
}

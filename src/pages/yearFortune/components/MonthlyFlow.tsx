
import { useState } from "react";
import { CheonGan, GanZhi } from "../saju/types";
import { ganZhiToHanja } from "../saju/ganzhi";
import { GOOD_MONTH_THRESHOLD, CAUTION_MONTH_THRESHOLD, getMonthInterpretation } from "../saju/mock/insights";
import styles from "./MonthlyFlow.module.css";

export interface MonthlyFlowProps {
  monthlyScores: number[];
  monthlyGanZhi: GanZhi[];
  dayMaster: CheonGan;
}

const MAX_SCORE = 5;

function barClassName(score: number): string {
  if (score >= GOOD_MONTH_THRESHOLD) return styles.barGood;
  if (score <= CAUTION_MONTH_THRESHOLD) return styles.barCaution;
  return styles.barNeutral;
}

export function MonthlyFlow({ monthlyScores, monthlyGanZhi, dayMaster }: MonthlyFlowProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <section className={styles.section} aria-label="월별 흐름">
      <div className={styles.header}>
        <h3 className={styles.heading}>월별 흐름</h3>
        <button
          type="button"
          className={styles.infoButton}
          aria-label="월별 간지 보기"
          onClick={() => setShowPopup((prev) => !prev)}
        >
          ?
        </button>
      </div>

      {showPopup && (
        <ul className={styles.popup} role="list">
          {monthlyGanZhi.map((gz, i) => (
            <li key={i} className={styles.popupItem}>
              <span className={styles.popupMonth}>
                {i + 1}월 {ganZhiToHanja(gz)}
              </span>
              <span className={styles.popupInterpretation}>
                {getMonthInterpretation(gz.gan, dayMaster)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.bars}>
        {monthlyScores.map((score, i) => (
          <div key={i} className={styles.barColumn}>
            <div
              className={barClassName(score)}
              style={{ height: `${(score / MAX_SCORE) * 100}%` }}
            />
            <span className={styles.barLabel}>{i + 1}월</span>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <span>근거: 월운 간지 × 일간 상생상극 점수</span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchGood}`} aria-hidden="true" />
          좋은 달
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchCaution}`} aria-hidden="true" />
          주의 달
        </span>
      </div>
    </section>
  );
}

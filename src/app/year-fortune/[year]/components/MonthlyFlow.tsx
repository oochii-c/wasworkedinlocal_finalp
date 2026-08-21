"use client";

import { useState } from "react";
import { GanZhi } from "@/saju/types";
import { ganZhiToHanja } from "@/saju/ganzhi";
import styles from "./MonthlyFlow.module.css";

export interface MonthlyFlowProps {
  monthlyScores: number[];
  monthlyGanZhi: GanZhi[];
}

const GOOD_THRESHOLD = 3;
const MAX_SCORE = 5;

export function MonthlyFlow({ monthlyScores, monthlyGanZhi }: MonthlyFlowProps) {
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
            <li key={i}>
              {i + 1}월 {ganZhiToHanja(gz)}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.bars}>
        {monthlyScores.map((score, i) => (
          <div key={i} className={styles.barColumn}>
            <div
              className={score >= GOOD_THRESHOLD ? styles.barGood : styles.barCaution}
              style={{ height: `${(score / MAX_SCORE) * 100}%` }}
            />
            <span className={styles.barLabel}>{i + 1}월</span>
          </div>
        ))}
      </div>
    </section>
  );
}

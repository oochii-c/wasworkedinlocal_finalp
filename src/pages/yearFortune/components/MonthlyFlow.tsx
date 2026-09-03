
import { useState } from "react";
import { CheonGan, GanZhi } from "../saju/types";
import { ganZhiToHanja } from "../saju/ganzhi";
import { GOOD_MONTH_THRESHOLD, CAUTION_MONTH_THRESHOLD, getMonthInterpretation } from "../saju/mock/insights";
import { smoothPath } from "../../dashboard/DaYunFlow";
import styles from "./MonthlyFlow.module.css";

export interface MonthlyFlowProps {
  monthlyScores: number[];
  monthlyGanZhi: GanZhi[];
  dayMaster: CheonGan;
}

// 대운(인생 흐름) 그래프와 같은 좌표계 — 두 화면의 그래프가 같은 형태로 보이도록 맞춤
const W = 320, H = 80, PX = 16, PY = 12;

function dotColor(score: number): string {
  if (score >= GOOD_MONTH_THRESHOLD) return "#EACB8A";
  if (score <= CAUTION_MONTH_THRESHOLD) return "var(--saju-red)";
  return "rgba(184,206,224,0.55)";
}

export function MonthlyFlow({ monthlyScores, monthlyGanZhi, dayMaster }: MonthlyFlowProps) {
  const [showPopup, setShowPopup] = useState(false);

  // 12개 점을 좌우 여백 안에 균등 배치. y는 1~5점을 위아래로 뒤집어 매핑.
  const points = monthlyScores.map((score, i) => ({
    x: PX + (i / (monthlyScores.length - 1)) * (W - PX * 2),
    y: PY + (H - PY * 2) * (1 - (score - 1) / 4),
  }));

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

      <div className={styles.graphWrap}>
        <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" style={{ display: "block" }} aria-hidden="true">
          {/* 격자 (1~5점) */}
          {[1, 2, 3, 4, 5].map((star) => {
            const y = PY + (H - PY * 2) * (1 - (star - 1) / 4);
            return <line key={star} x1={PX} x2={W - PX} y1={y} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
          })}

          {/* 베지어 곡선 */}
          <path d={smoothPath(points)} fill="none"
            stroke="rgba(184,206,224,0.5)" strokeWidth="1.5" />

          {/* 월별 꼭짓점 — 좋은 달/주의 달은 색으로 구분 */}
          {points.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={dotColor(monthlyScores[i])} />
          ))}

          {/* X축 월 레이블 */}
          {points.map((pt, i) => (
            <text key={i} x={pt.x} y={H + 16}
              fontSize="9.5" textAnchor="middle" fill="rgba(184,206,224,0.6)">
              {i + 1}
            </text>
          ))}
        </svg>
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

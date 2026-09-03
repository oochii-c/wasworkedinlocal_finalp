
import { useState } from "react";
import { CheonGan, GanZhi } from "../saju/types";
import { ganZhiToHanja } from "../saju/ganzhi";
import { getMonthInterpretation, scoreColor } from "../saju/insights";
import { smoothPath } from "../../dashboard/DaYunFlow";
import styles from "./MonthlyFlow.module.css";

export interface MonthlyFlowProps {
  monthlyScores: number[];
  monthlyGanZhi: GanZhi[];
  dayMaster: CheonGan;
  // 달을 탭했을 때 보여줄 월별 LLM 풀이 12개. 비면 로컬 폴백 문구를 쓴다.
  monthTexts?: string[] | null;
  // 아무 달도 선택하지 않았을 때 설명문 자리에 상시 노출되는 올해 총운 풀이
  yearSummary: string;
}

// 대운(인생 흐름) 그래프와 같은 좌표계 — 두 화면의 그래프가 같은 형태로 보이도록 맞춤
const W = 320, H = 80, PX = 16, PY = 12;

export function MonthlyFlow({ monthlyScores, monthlyGanZhi, dayMaster, monthTexts, yearSummary }: MonthlyFlowProps) {
  // 선택된 달 인덱스(0~11). null이면 아무 달도 펼치지 않은 상태.
  const [selected, setSelected] = useState<number | null>(null);

  // 12개 점을 좌우 여백 안에 균등 배치. y는 1~5점을 위아래로 뒤집어 매핑.
  const points = monthlyScores.map((score, i) => ({
    x: PX + (i / (monthlyScores.length - 1)) * (W - PX * 2),
    y: PY + (H - PY * 2) * (1 - (score - 1) / 4),
  }));

  // 각 점을 감싸는 클릭 밴드 폭 — 인접 점 사이 간격의 절반씩
  const step = (W - PX * 2) / (monthlyScores.length - 1);

  const toggle = (i: number) => setSelected((prev) => (prev === i ? null : i));

  return (
    <section aria-label="월별 흐름">
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

          {/* 월별 클릭 영역 — 점 주변을 넓게 잡아 탭하기 쉽게 */}
          {points.map((pt, i) => {
            const x1 = i === 0 ? 0 : pt.x - step / 2;
            const x2 = i === points.length - 1 ? W : pt.x + step / 2;
            return (
              <rect key={i}
                x={x1} y={0} width={x2 - x1} height={H}
                fill="transparent" style={{ cursor: "pointer" }}
                onClick={() => toggle(i)}
              />
            );
          })}

          {/* 월별 꼭짓점 — 좋은 달/주의 달은 색으로 구분, 선택 시 확대 */}
          {points.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y}
              r={i === selected ? 5 : 3}
              fill={scoreColor(monthlyScores[i])}
              stroke={i === selected ? "#EAF2FB" : "none"}
              strokeWidth={i === selected ? 1.5 : 0}
              style={{ pointerEvents: "none" }}
            />
          ))}

          {/* X축 월 레이블 */}
          {points.map((pt, i) => (
            <text key={i} x={pt.x} y={H + 16}
              fontSize="9.5" textAnchor="middle"
              fill={i === selected ? "rgba(234,203,138,0.95)" : "rgba(184,206,224,0.6)"}
              fontWeight={i === selected ? "700" : "500"}
              style={{ pointerEvents: "none" }}>
              {i + 1}
            </text>
          ))}
        </svg>
      </div>

      <div className={styles.detail} aria-live="polite">
        {selected === null ? (
          <>
            <div className={styles.detailHead}>
              <span className={styles.detailMonth}>올해 풀이</span>
            </div>
            <span className={styles.detailInterpretation}>{yearSummary}</span>
          </>
        ) : (
          <>
            <div className={styles.detailHead}>
              <span className={styles.detailMonth}>
                {selected + 1}월 {ganZhiToHanja(monthlyGanZhi[selected])}
              </span>
              <span className={styles.detailScore}>{monthlyScores[selected]}점</span>
            </div>
            <span className={styles.detailInterpretation}>
              {monthTexts?.[selected] || getMonthInterpretation(monthlyGanZhi[selected].gan, dayMaster)}
            </span>
          </>
        )}
      </div>
    </section>
  );
}

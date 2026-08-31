import { useState } from "react";
import { WUXING_SVG_COLOR } from "./constants";

interface Props {
  wuXingCount: Record<string, number>;
}

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const CX = 90, CY = 84, R = 60;
const MIN_R = 7, MAX_R = 20;
// 버블 크기 = 절대 개수 기준 고정 스케일. 이 개수 이상이면 최대 버블(차트 간 비교 가능).
const FULL_COUNT = 6;

// 정오각형 꼭짓점 (상단=木 → 시계방향)
function pentaPoints(cx: number, cy: number, r: number): [number, number][] {
  return ELEMENTS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
}

const OUTLINE_PTS = pentaPoints(CX, CY, R);
const outlineStr = OUTLINE_PTS.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const lineSegments: [number, number, number, number][] = [];
for (let i = 0; i < 5; i++) {
  for (let j = i + 2; j < 5; j++) {
    if (!(i === 0 && j === 4)) {
      lineSegments.push([OUTLINE_PTS[i][0], OUTLINE_PTS[i][1], OUTLINE_PTS[j][0], OUTLINE_PTS[j][1]]);
    }
  }
}

export default function ElementStar({ wuXingCount }: Props) {
  const [activeEl, setActiveEl] = useState<string | null>(null);

  const total = Object.values(wuXingCount).reduce((a, b) => a + b, 0);

  return (
    <section className="db-section db-chart-section" aria-label="오행 분포">
      <h3 className="db-section-title">오행</h3>
      <svg
        width="100%"
        height="auto"
        viewBox="0 0 180 168"
        style={{ display: "block", width: "100%" }}
        aria-hidden="true"
      >
        {/* 내부 대각선 */}
        {lineSegments.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(234,203,138,0.14)"
            strokeWidth="1"
          />
        ))}

        {/* 오각형 윤곽 */}
        <polygon
          points={outlineStr}
          fill="none"
          stroke="rgba(234,203,138,0.25)"
          strokeWidth="1"
        />

        {/* 원소 버블 */}
        {ELEMENTS.map((el, i) => {
          const [px, py] = OUTLINE_PTS[i];
          const count = wuXingCount[el] ?? 0;
          const ratio = Math.min(count / FULL_COUNT, 1);
          const r = MIN_R + ratio * (MAX_R - MIN_R);
          const color = WUXING_SVG_COLOR[el];
          const isActive = activeEl === el;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <g
              key={el}
              onClick={() => setActiveEl(prev => prev === el ? null : el)}
              style={{ cursor: "pointer" }}
            >
              {/* 글로우 배경 — 부드럽게 페이드 */}
              <circle
                cx={px} cy={py}
                r={r + 7}
                fill={color}
                style={{
                  opacity: isActive ? 0.32 : 0,
                  transition: "opacity 0.4s ease",
                  filter: "blur(9px)",
                }}
              />

              {/* 회전 점선 링 — opacity로 페이드, transform으로 회전 */}
              <circle
                cx={px} cy={py}
                r={r + 7}
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeDasharray="1 5"
                strokeLinecap="round"
                style={{
                  opacity: isActive ? 0.5 : 0,
                  transition: "opacity 0.4s ease",
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animation: "el-spin 25s linear infinite",
                }}
              />

              {/* 메인 버블 */}
              <circle
                cx={px} cy={py}
                r={r}
                fill={color}
                style={{
                  opacity: count === 0 ? 0.28 : (isActive ? 1 : 0.88),
                  transition: "opacity 0.35s ease",
                }}
              />

              {/* 한자 */}
              <text
                x={px}
                y={isActive ? py - 2 : py + 1}
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.95)"
                fontWeight="700"
                style={{
                  pointerEvents: "none",
                  transition: "y 0.3s ease",
                }}
              >
                {el}
              </text>

              {/* 퍼센트 — opacity 트랜지션으로 부드럽게 등장 */}
              <text
                x={px}
                y={py + 10}
                fontSize="9"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="700"
                fill="rgba(255,255,255,0.92)"
                style={{
                  pointerEvents: "none",
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.35s ease 0.05s",
                }}
              >
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

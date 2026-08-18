import { WUXING_SVG_COLOR } from "./constants";

interface Props {
  wuXingCount: Record<string, number>;
}

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const CX = 90, CY = 84, R = 60;
const MIN_R = 7, MAX_R = 20;

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
  const maxCount = Math.max(...Object.values(wuXingCount), 1);

  return (
    <section className="db-section db-chart-section" aria-label="오행 분포">
      <h3 className="db-section-title">오행</h3>
      <svg
        width="100%"
        height="auto"
        viewBox="0 0 180 168"
        style={{ display: "block", maxWidth: "200px" }}
        aria-hidden="true"
      >
        {/* 내부 대각선 */}
        {lineSegments.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
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
          const ratio = count / maxCount;
          const r = MIN_R + ratio * (MAX_R - MIN_R);
          const color = WUXING_SVG_COLOR[el];
          const opacity = count === 0 ? 0.28 : 0.88;
          return (
            <g key={el}>
              <circle cx={px} cy={py} r={r} fill={color} opacity={opacity} />
              <text
                x={px}
                y={py + 1}
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.95)"
                fontWeight="700"
              >
                {el}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

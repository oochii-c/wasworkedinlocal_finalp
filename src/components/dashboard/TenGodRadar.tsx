import { SIPSHEN_LABELS } from "./constants";

interface Props {
  shiShenCount: Record<string, number>;
}

const CX = 90, CY = 84, R = 52;
const LABELS_KR = [
  ["비겁", "(자립)"],
  ["식상", "(표현)"],
  ["재성", "(현실)"],
  ["관성", "(책임)"],
  ["인성", "(공부)"],
];

function pentaPoint(cx: number, cy: number, r: number, i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function labelOffset(i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
  // 꼭짓점 바깥쪽으로 부드럽게 방사형 배치
  return [Math.cos(angle) * 19, Math.sin(angle) * 16];
}

export default function TenGodRadar({ shiShenCount }: Props) {
  const maxCount = Math.max(...SIPSHEN_LABELS.map(l => shiShenCount[l] ?? 0), 1);

  const innerPts = SIPSHEN_LABELS.map((lbl, i) => {
    const count = shiShenCount[lbl] ?? 0;
    const ratio = count / maxCount;
    return pentaPoint(CX, CY, R * Math.max(ratio, 0.08), i);
  });
  const innerStr = innerPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <section className="db-section db-chart-section" aria-label="십성 레이더">
      <h3 className="db-section-title">십성 성향</h3>
      <svg
        width="100%"
        height="auto"
        viewBox="0 0 180 168"
        style={{ display: "block", maxWidth: "200px" }}
        aria-hidden="true"
      >
        {/* 격자 레이어 */}
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon
            key={scale}
            points={SIPSHEN_LABELS.map((_, i) => {
              const [x, y] = pentaPoint(CX, CY, R * scale, i);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(234,203,138,0.12)"
            strokeWidth="1"
          />
        ))}

        {/* 방사형 축선 */}
        {SIPSHEN_LABELS.map((_, i) => {
          const [x, y] = pentaPoint(CX, CY, R, i);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="rgba(234,203,138,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* 내부 채움 영역 */}
        <polygon
          points={innerStr}
          fill="rgba(234,203,138,0.16)"
          stroke="rgba(234,203,138,0.7)"
          strokeWidth="1.5"
        />

        {/* 꼭짓점 점 */}
        {innerPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#EACB8A" />
        ))}

        {/* 십성 라벨 */}
        {SIPSHEN_LABELS.map((lbl, i) => {
          const [ox, oy] = labelOffset(i);
          const [bx, by] = pentaPoint(CX, CY, R, i);
          const [title, sub] = LABELS_KR[i];
          return (
            <text
              key={lbl}
              x={bx + ox}
              y={by + oy}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              <tspan
                x={bx + ox}
                dy="-3"
                fontSize="11"
                fontWeight="700"
                fill="#EACB8A"
              >
                {title}
              </tspan>
              <tspan
                x={bx + ox}
                dy="11.5"
                fontSize="8.5"
                fontWeight="400"
                fill="rgba(184,206,224,0.8)"
              >
                {sub}
              </tspan>
            </text>
          );
        })}
      </svg>
    </section>
  );
}

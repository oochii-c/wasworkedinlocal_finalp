import { SIPSHEN_LABELS } from "./constants";

interface Props {
  shiShenCount: Record<string, number>;
}

const CX = 84, CY = 80, R = 55;
const LABELS_KR = ["비겁\n(자립)", "식상\n(표현)", "재성\n(현실)", "관성\n(책임)", "인성\n(공부)"];

function pentaPoint(cx: number, cy: number, r: number, i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function labelOffset(i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
  return [Math.cos(angle) * 18, Math.sin(angle) * 16];
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
      <svg width="168" height="160" viewBox="0 0 168 160" aria-hidden="true">
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
        {/* 축선 */}
        {SIPSHEN_LABELS.map((_, i) => {
          const [x, y] = pentaPoint(CX, CY, R, i);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(234,203,138,0.1)" strokeWidth="1" />;
        })}
        {/* 내부 채움 polygon */}
        <polygon
          points={innerStr}
          fill="rgba(234,203,138,0.15)"
          stroke="rgba(234,203,138,0.6)"
          strokeWidth="1.5"
        />
        {/* 꼭짓점 점 */}
        {innerPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#EACB8A" />
        ))}
        {/* 레이블 */}
        {SIPSHEN_LABELS.map((lbl, i) => {
          const [ox, oy] = labelOffset(i);
          const [bx, by] = pentaPoint(CX, CY, R, i);
          const lines = LABELS_KR[i].split("\n");
          return (
            <text
              key={lbl}
              x={bx + ox}
              y={by + oy}
              fontSize="7"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(155,184,203,0.9)"
            >
              {lines.map((line, j) => (
                <tspan key={j} x={bx + ox} dy={j === 0 ? 0 : 9}>{line}</tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

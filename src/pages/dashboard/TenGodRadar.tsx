import { useState } from "react";
import {
  SIPSHEN_LABELS, SIPSHEN_COLOR, sipshenStrengthLabel,
  sipshenRatio, SIPSHEN_FULL_RATIO, SIPSHEN_MIN_FILL, strengthParticle,
} from "./constants";

interface Props {
  shiShenCount: Record<string, number>;
}

const CX = 90, CY = 84, R = 60;

function pentaPoint(cx: number, cy: number, r: number, i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function labelOffset(i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
  return [Math.cos(angle) * 19, Math.sin(angle) * 16];
}

// ✨ 4각 별 path — (cx,cy) 중심, ro=바깥 반지름, ri=안쪽 반지름
function sparklePath(cx: number, cy: number, ro: number, ri: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) {
    const r = k % 2 === 0 ? ro : ri;
    const angle = (Math.PI * 2 * k) / 8 - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

const SIPSHEN_DESC: Record<string, Record<string, string>> = {
  비겁: {
    풍부한: "비겁은 나 자신을 세우는 자아와 자립의 기운이에요. 독립심과 추진력을 상징하죠. 당신의 사주에는 이 기운이 풍부해, 스스로 길을 개척하는 힘이 강하고 어떤 일이든 내 힘으로 해결하려는 성향이 뚜렷해요. 다만 강한 자의식이 때로 고집처럼 느껴질 수 있으니, 타인의 의견에도 열린 태도를 가져보세요.",
    적당한: "비겁은 나 자신을 세우는 자아와 자립의 기운이에요. 독립심과 추진력을 상징하죠. 당신의 사주에는 이 기운이 고르게 있어, 혼자서도 잘 하지만 협력할 줄도 아는 균형 잡힌 자립심을 갖추고 있어요.",
    적은: "비겁은 나 자신을 세우는 자아와 자립의 기운이에요. 독립심과 추진력을 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 혼자 앞서기보다 주변과 함께 움직이는 협력적인 방식이 더 자연스럽게 맞아요.",
    "채워야 하는": "비겁은 나 자신을 세우는 자아와 자립의 기운이에요. 독립심과 추진력을 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 자신을 앞세우기보다 타인을 위해 힘을 쓰는 헌신적인 성향이 강해요. 그 따뜻함이 당신의 큰 강점이에요.",
  },
  식상: {
    풍부한: "식상은 내면의 것을 세상에 꺼내놓는 표현과 창의의 기운이에요. 언어·예술·아이디어를 상징하죠. 당신의 사주에는 이 기운이 넘쳐, 생각을 말과 행동으로 풀어내는 능력이 뛰어나고 창의적인 방식으로 문제를 해결하는 걸 즐겨요. 다만 말이 많아지거나 감정 기복이 커질 수 있으니, 표현 뒤의 충분한 숙고도 챙겨보세요.",
    적당한: "식상은 내면의 것을 세상에 꺼내놓는 표현과 창의의 기운이에요. 언어·예술·아이디어를 상징하죠. 당신의 사주에는 이 기운이 적당히 있어, 필요할 때 자신을 잘 표현하면서도 감정에 휩쓸리지 않는 균형감이 있어요.",
    적은: "식상은 내면의 것을 세상에 꺼내놓는 표현과 창의의 기운이에요. 언어·예술·아이디어를 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 즉흥적인 표현보다 깊이 생각하고 신중하게 말하는 스타일이 강해요.",
    "채워야 하는": "식상은 내면의 것을 세상에 꺼내놓는 표현과 창의의 기운이에요. 언어·예술·아이디어를 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 말보다 행동으로 보여주는 묵직한 실행력이 두드러져요. 꾸밈없는 진중함이 신뢰를 만들어요.",
  },
  재성: {
    풍부한: "재성은 세상을 현실로 다루는 재물과 실용의 기운이에요. 현실적인 감각과 성취를 상징하죠. 당신의 사주에는 이 기운이 풍부해, 기회를 포착하는 눈이 밝고 실질적인 결과를 만들어내는 능력이 있어요. 다만 소유와 성과에 집착하면 관계가 소홀해질 수 있으니, 여유를 나누는 따뜻함도 함께 키워보세요.",
    적당한: "재성은 세상을 현실로 다루는 재물과 실용의 기운이에요. 현실적인 감각과 성취를 상징하죠. 당신의 사주에는 이 기운이 고르게 있어, 현실 감각을 갖추면서도 물질에 지나치게 집착하지 않는 여유로운 균형감이 있어요.",
    적은: "재성은 세상을 현실로 다루는 재물과 실용의 기운이에요. 현실적인 감각과 성취를 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 물질보다 가치와 의미를 더 중요하게 여기는 성향이 강해요.",
    "채워야 하는": "재성은 세상을 현실로 다루는 재물과 실용의 기운이에요. 현실적인 감각과 성취를 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 돈과 성과보다 원칙·명예·관계를 삶의 중심에 두는 스타일이에요.",
  },
  관성: {
    풍부한: "관성은 사회 속에서 자신의 자리를 찾는 명예와 책임의 기운이에요. 규율과 성취 욕구를 상징하죠. 당신의 사주에는 이 기운이 넘쳐, 원칙을 중시하고 맡은 일에 철저한 책임감을 발휘해요. 다만 지나치게 규범에 얽매이면 스트레스가 커질 수 있으니, 때로는 내려놓는 여유도 필요해요.",
    적당한: "관성은 사회 속에서 자신의 자리를 찾는 명예와 책임의 기운이에요. 규율과 성취 욕구를 상징하죠. 당신의 사주에는 이 기운이 고르게 있어, 사회적 책임감을 갖추면서도 자신을 과도하게 옥죄지 않는 여유로운 균형이 있어요.",
    적은: "관성은 사회 속에서 자신의 자리를 찾는 명예와 책임의 기운이에요. 규율과 성취 욕구를 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 정해진 틀보다 자신만의 방식으로 자유롭게 나아가는 성향이 강해요.",
    "채워야 하는": "관성은 사회 속에서 자신의 자리를 찾는 명예와 책임의 기운이에요. 규율과 성취 욕구를 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 제도나 틀에 얽매이지 않고 자신만의 가치와 방향으로 살아가는 독립적인 성향이 뚜렷해요.",
  },
  인성: {
    풍부한: "인성은 배움과 보호, 사색의 기운이에요. 지혜와 깊이를 상징하죠. 당신의 사주에는 이 기운이 풍부해, 탐구하고 이해하려는 욕구가 강하고 스스로를 보호하려는 신중함이 있어요. 다만 생각이 너무 깊어지면 행동으로 옮기는 데 오래 걸릴 수 있으니, 과감한 실천도 함께 연습해보세요.",
    적당한: "인성은 배움과 보호, 사색의 기운이에요. 지혜와 깊이를 상징하죠. 당신의 사주에는 이 기운이 고르게 있어, 깊이 사색하는 힘과 적절한 행동력이 균형을 이루고 있어요.",
    적은: "인성은 배움과 보호, 사색의 기운이에요. 지혜와 깊이를 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 책보다 경험 속에서 배우는 실전형 스타일이 강해요. 이론보다 직접 부딪혀보는 걸 더 좋아하는 성향이에요.",
    "채워야 하는": "인성은 배움과 보호, 사색의 기운이에요. 지혜와 깊이를 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 누군가에게 기대기보다 스스로 길을 개척하는 자수성가형 에너지가 강해요. 독학과 실전으로 쌓은 경험이 가장 큰 자산이에요.",
  },
};

export default function TenGodRadar({ shiShenCount }: Props) {
  // 초기 활성값 = 개수가 가장 많은 십성 (동점이면 배열 순서 첫 번째)
  const [activeShin, setActiveShin] = useState<string | null>(
    () => SIPSHEN_LABELS.reduce(
      (mx, lbl) => (shiShenCount[lbl] ?? 0) > (shiShenCount[mx] ?? 0) ? lbl : mx,
      SIPSHEN_LABELS[0] as string,
    )
  );

  const total = SIPSHEN_LABELS.reduce((sum, l) => sum + (shiShenCount[l] ?? 0), 0);

  const innerPts = SIPSHEN_LABELS.map((lbl, i) => {
    // 균등(1/5) 대비 배율로 반지름을 잡는다 — 균등이면 축 중간, 균등의 2배면 축 끝.
    // 고정 천장(share/0.30)을 쓰면 균등 20%가 이미 축의 2/3라 대부분의 사주가
    // 통통한 정오각형으로 뭉개졌다.
    const fill = Math.min(1, sipshenRatio(shiShenCount[lbl] ?? 0, total) / SIPSHEN_FULL_RATIO);
    return pentaPoint(CX, CY, R * Math.max(fill, SIPSHEN_MIN_FILL), i);
  });
  const innerStr = innerPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <section className="db-section db-chart-section" aria-label="십성 레이더">
      <h3 className="db-section-title">십성 성향</h3>
      {/* 그래프 래퍼 — 오행과 동일 높이 박스로 상단 정렬 (아래 설명 박스 높이 균등화) */}
      <div className="db-chart-graph">
        <svg
          width="100%"
          height="auto"
          viewBox="0 0 180 168"
          style={{ display: "block", width: "100%", transform: "translateY(10px)" }}
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
              stroke="#4a5e6e"
              strokeWidth="1"
            />
          ))}

          {/* 방사형 축선 */}
          {SIPSHEN_LABELS.map((_, i) => {
            const [x, y] = pentaPoint(CX, CY, R, i);
            return (
              <line
                key={i}
                x1={CX} y1={CY} x2={x} y2={y}
                stroke="#3a5060"
                strokeWidth="1"
              />
            );
          })}

          {/* 내부 채움 영역 */}
          <polygon
            points={innerStr}
            fill="rgba(168,188,200,0.18)"
            stroke="#7a9aaa"
            strokeWidth="1.5"
          />

          {/* 꼭짓점 — 활성이면 ✨ 4각별 + 글로우, 비활성이면 일반 점 */}
          {innerPts.map(([x, y], i) => {
            const lbl = SIPSHEN_LABELS[i];
            const isActive = activeShin === lbl;
            const color = isActive ? SIPSHEN_COLOR[lbl] : "#EACB8A";
            return (
              <g
                key={i}
                onClick={() => setActiveShin(lbl)}
                style={{ cursor: "pointer" }}
              >
                {isActive ? (
                  <>
                    {/* 블러 글로우 배경 */}
                    <circle
                      cx={x} cy={y} r={14}
                      fill={color}
                      style={{ opacity: 0.3, filter: "blur(7px)" }}
                    />
                    {/* ✨ 4각별 (메인) */}
                    <path
                      d={sparklePath(x, y, 12, 2.6)}
                      fill={color}
                      style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                    />
                    {/* 보조 별 (45° 회전 오버레이) */}
                    <path
                      d={sparklePath(x, y, 8, 1.8)}
                      fill="white"
                      style={{ opacity: 0.5, transform: `rotate(45deg)`, transformBox: "fill-box", transformOrigin: "center" }}
                    />
                  </>
                ) : (
                  <circle cx={x} cy={y} r={3} fill="#7a9aaa" />
                )}
              </g>
            );
          })}

          {/* 십성 라벨 — 클릭 시 활성화, 활성 라벨은 색상+크기 변경 */}
          {SIPSHEN_LABELS.map((lbl, i) => {
            const [ox, oy] = labelOffset(i);
            const [bx, by] = pentaPoint(CX, CY, R, i);
            const isActive = activeShin === lbl;
            return (
              <text
                key={lbl}
                x={bx + ox}
                y={by + oy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isActive ? "12.5" : "11"}
                fontWeight="700"
                fill={isActive ? SIPSHEN_COLOR[lbl] : "#a8bcc8"}
                onClick={() => setActiveShin(lbl)}
                style={{ cursor: "pointer", transition: "fill 0.3s ease" }}
              >
                {lbl}
              </text>
            );
          })}
        </svg>
      </div>

      {activeShin && (() => {
        const strength = sipshenStrengthLabel(shiShenCount[activeShin] ?? 0, total);
        return (
          <p className="db-ai-box">
            <b>
              <span style={{ color: SIPSHEN_COLOR[activeShin] }}>{activeShin}</span>{strengthParticle(strength)} {strength} 사주예요.
            </b>
            {SIPSHEN_DESC[activeShin][strength]}
          </p>
        );
      })()}
    </section>
  );
}

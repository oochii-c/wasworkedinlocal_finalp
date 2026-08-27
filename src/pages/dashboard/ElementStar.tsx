import { useState } from "react";
import { WUXING_SVG_COLOR } from "./constants";

interface Props {
  wuXingCount: Record<string, number>;
}

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const CX = 90, CY = 84, R = 64;
const MIN_R = 8, MAX_R = 22;
const GLOW_R = 7; // 활성 버블 글로우·링 반지름 오프셋 (화살표 트리밍도 이 값에 맞춤)
const SHENG_COLOR = "#66B2D6"; // 相生 청록
const KE_COLOR = "#E0685E";    // 相剋 코랄레드
const HEAD = 7;    // 활성 화살촉 길이 (= markerWidth). 선을 이만큼 짧게 잘라 촉이 앞을 채움
const HEAD_SM = 4; // 비활성 화살촉 길이

// 정오각형 꼭짓점 (상단=木 → 시계방향)
function pentaPoints(cx: number, cy: number, r: number): [number, number][] {
  return ELEMENTS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
}

const OUTLINE_PTS = pentaPoints(CX, CY, R);

export default function ElementStar({ wuXingCount }: Props) {
  // 초기 활성값 = 개수가 가장 많은 오행 (동점이면 木→火→土→金→水 순 첫 번째)
  const [activeEl, setActiveEl] = useState<string | null>(
    () => ELEMENTS.reduce((mx, el) => (wuXingCount[el] ?? 0) > (wuXingCount[mx] ?? 0) ? el : mx, ELEMENTS[0] as string)
  );

  const total = Object.values(wuXingCount).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(wuXingCount), 1);

  // 각 오행 버블의 현재 반지름 (개수에 따라 매번 변함)
  const bubbleRadii = ELEMENTS.map(el => MIN_R + ((wuXingCount[el] ?? 0) / maxCount) * (MAX_R - MIN_R));

  // 상생(生, 가장자리)·상극(剋, 대각선) 화살표. 평소엔 전부 얇게, 활성 오행과 얽힌 것만 굵게.
  const activeIdx = ELEMENTS.findIndex(el => el === activeEl);
  const GAP = 3;
  // 화살표가 버블에 안 가려지게 잘라낼 반지름. 활성 노드는 글로우(+7)까지 피함.
  const nodeR = (i: number) => bubbleRadii[i] + (ELEMENTS[i] === activeEl ? GLOW_R : 0);
  const buildArrow = (a: number, b: number, kind: "sheng" | "ke") => {
    const active = a === activeIdx || b === activeIdx; // 활성 오행이 출발·도착이면 강조
    const head = active ? HEAD : HEAD_SM;
    const [ax, ay] = OUTLINE_PTS[a];
    const [bx, by] = OUTLINE_PTS[b];
    const len = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / len, uy = (by - ay) / len;
    return {
      id: `${kind}-${a}-${b}`,
      kind,
      active,
      x1: ax + ux * (nodeR(a) + GAP), y1: ay + uy * (nodeR(a) + GAP),
      // 도착점은 화살촉 길이(head)만큼 더 당겨서, 그 빈 자리를 촉이 채우고 끝이 뾰족하게
      x2: bx - ux * (nodeR(b) + GAP + head), y2: by - uy * (nodeR(b) + GAP + head),
    };
  };
  const arrows: ReturnType<typeof buildArrow>[] = [];
  for (let i = 0; i < 5; i++) {
    arrows.push(buildArrow(i, (i + 1) % 5, "sheng")); // 生: i → i+1 (가장자리)
    arrows.push(buildArrow(i, (i + 2) % 5, "ke"));    // 剋: i → i+2 (대각선)
  }
  // 활성 화살표가 위에 그려지도록(안 가려지게) 뒤로 정렬
  arrows.sort((a, b) => Number(a.active) - Number(b.active));

  return (
    <section className="db-section db-chart-section" aria-label="오행 분포" style={{ position: "relative" }}>
      <h3 className="db-section-title">오행</h3>

      {/* 범례 — 生/剋 화살표 색 안내 (그래프 좌상단) */}
      <div
        style={{
          position: "absolute", top: 12, right: 12,
          display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
          fontSize: 11, lineHeight: 1.3, pointerEvents: "none",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.8)" }}>
          <span style={{ color: SHENG_COLOR, fontWeight: 700 }}>→</span> 생(生)
        </span>
        <span style={{ color: "rgba(255,255,255,0.8)" }}>
          <span style={{ color: KE_COLOR, fontWeight: 700 }}>→</span> 극(剋)
        </span>
      </div>

      <svg
        width="100%"
        height="auto"
        viewBox="4 -4 170 166"
        style={{ display: "block", width: "100%", overflow: "visible" }}
        aria-hidden="true"
      >
        {/* 화살촉 정의 — 生(청록)·剋(코랄레드). markerUnits=userSpaceOnUse로 선 두께와 무관하게 고정 크기 */}
        <defs>
          <marker id="arw-sheng" viewBox="0 0 10 10" refX="0" refY="5" markerWidth={HEAD} markerHeight={HEAD} markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={SHENG_COLOR} />
          </marker>
          <marker id="arw-ke" viewBox="0 0 10 10" refX="0" refY="5" markerWidth={HEAD} markerHeight={HEAD} markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={KE_COLOR} />
          </marker>
          {/* 비활성용 — 화살촉 작게 */}
          <marker id="arw-sheng-sm" viewBox="0 0 10 10" refX="0" refY="5" markerWidth={HEAD_SM} markerHeight={HEAD_SM} markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={SHENG_COLOR} />
          </marker>
          <marker id="arw-ke-sm" viewBox="0 0 10 10" refX="0" refY="5" markerWidth={HEAD_SM} markerHeight={HEAD_SM} markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={KE_COLOR} />
          </marker>
        </defs>

        {/* 원소 버블 */}
        {ELEMENTS.map((el, i) => {
          const [px, py] = OUTLINE_PTS[i];
          const count = wuXingCount[el] ?? 0;
          const r = bubbleRadii[i];
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
                r={r + GLOW_R}
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
                r={r + GLOW_R}
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

        {/* 관계 화살표 — 전부 표시(生 가장자리·剋 대각선). 활성 오행과 얽힌 것만 굵게. 버블 위에 그려 안 가려짐 */}
        {arrows.map((ar) => (
          <line
            key={ar.id}
            x1={ar.x1} y1={ar.y1} x2={ar.x2} y2={ar.y2}
            stroke={ar.kind === "sheng" ? SHENG_COLOR : KE_COLOR}
            strokeWidth={ar.active ? 2 : 1}
            strokeLinecap="round"
            markerEnd={`url(#arw-${ar.kind}${ar.active ? "" : "-sm"})`}
            style={{ opacity: ar.active ? 0.95 : 0.5, transition: "opacity 0.3s ease, stroke-width 0.3s ease" }}
          />
        ))}
      </svg>
    </section>
  );
}

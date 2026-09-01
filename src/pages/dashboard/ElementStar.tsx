import { useEffect, useRef, useState } from "react";
import { WUXING_SVG_COLOR, strengthLabel, GRAPH_FULL_SHARE } from "./constants";

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

const ELEMENT_DESC: Record<string, Record<string, string>> = {
  木: {
    많은: "木은 위로 곧게 뻗어 오르는 성장과 생명력의 기운이에요. 새로운 시작과 추진력을 상징하죠. 당신의 사주에는 이 기운이 풍부해, 도전을 두려워하지 않고 먼저 나서는 힘이 강해요. 다만 그만큼 고집이 셀 수 있으니, 주변을 살피는 유연함도 함께 키워보세요.",
    적당한: "木은 위로 곧게 뻗어 오르는 성장과 생명력의 기운이에요. 새로운 시작과 추진력을 상징하죠. 당신의 사주에는 이 기운이 고르게 담겨 있어, 필요할 때 앞으로 나서고 때로는 기다릴 줄도 아는 균형감이 있어요.",
    적은: "木은 위로 곧게 뻗어 오르는 성장과 생명력의 기운이에요. 새로운 시작과 추진력을 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 무리한 경쟁보다 안정적인 흐름 속에서 실력을 쌓는 방식이 잘 맞아요.",
    없는: "木은 위로 곧게 뻗어 오르는 성장과 생명력의 기운이에요. 새로운 시작과 추진력을 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 혼자 앞서기보다 함께 가는 협력의 방식이 훨씬 자연스럽게 맞아요.",
  },
  火: {
    많은: "火는 사방으로 빛을 뿜어내는 열정과 표현의 기운이에요. 따뜻함과 사교성을 상징하죠. 당신의 사주에는 이 기운이 넘쳐, 어디서든 존재감이 뚜렷하고 사람들을 끌어당기는 매력이 있어요. 다만 감정의 기복이 클 수 있으니, 내면을 가라앉히는 시간을 의식적으로 가져보세요.",
    적당한: "火는 사방으로 빛을 뿜어내는 열정과 표현의 기운이에요. 따뜻함과 사교성을 상징하죠. 당신의 사주에는 이 기운이 적당히 있어, 활기차면서도 감정에 쉽게 휩쓸리지 않는 균형감을 갖추고 있어요.",
    적은: "火는 사방으로 빛을 뿜어내는 열정과 표현의 기운이에요. 따뜻함과 사교성을 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 감정을 겉으로 드러내기보다 안으로 깊이 담아두는 내향적인 성향이 강해요.",
    없는: "火는 사방으로 빛을 뿜어내는 열정과 표현의 기운이에요. 따뜻함과 사교성을 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 감정에 흔들리지 않는 차분하고 냉철한 판단력이 돋보여요. 그 이성적인 면이 오히려 큰 강점이에요.",
  },
  土: {
    많은: "土는 만물을 품고 중심을 잡아주는 안정과 포용의 기운이에요. 신뢰와 현실적인 감각을 상징하죠. 당신의 사주에는 이 기운이 풍부해, 어떤 상황에서도 흔들리지 않는 무게감과 포용력이 있어요. 다만 변화에 다소 느릴 수 있으니, 새로운 흐름을 받아들이는 유연함도 키워보세요.",
    적당한: "土는 만물을 품고 중심을 잡아주는 안정과 포용의 기운이에요. 신뢰와 현실적인 감각을 상징하죠. 당신의 사주에는 이 기운이 고르게 있어, 안정감을 유지하면서도 변화에 유연하게 대응할 수 있는 균형감이 있어요.",
    적은: "土는 만물을 품고 중심을 잡아주는 안정과 포용의 기운이에요. 신뢰와 현실적인 감각을 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 한 곳에 오래 머물기보다 새로운 환경과 변화 속에서 활력을 찾는 성향이 강해요.",
    없는: "土는 만물을 품고 중심을 잡아주는 안정과 포용의 기운이에요. 신뢰와 현실적인 감각을 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 정해진 틀에 얽매이지 않고 자유롭게 흐르는 에너지가 강해요. 다양한 경험을 통해 성장하는 타입이에요.",
  },
  金: {
    많은: "金은 불필요한 것을 걷어내고 본질만 남기는 결단과 정제의 기운이에요. 의리와 강직함을 상징하죠. 당신의 사주에는 이 기운이 넘쳐, 흑과 백을 명확히 가르는 결단력과 원칙에 대한 강한 신념이 있어요. 다만 지나친 고집은 관계를 어렵게 할 수 있으니, 조화를 찾는 연습도 필요해요.",
    적당한: "金은 불필요한 것을 걷어내고 본질만 남기는 결단과 정제의 기운이에요. 의리와 강직함을 상징하죠. 당신의 사주에는 이 기운이 적당히 있어, 원칙을 지키면서도 상황에 따라 융통성 있게 대처하는 균형감이 있어요.",
    적은: "金은 불필요한 것을 걷어내고 본질만 남기는 결단과 정제의 기운이에요. 의리와 강직함을 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 엄격한 원칙보다 감성과 직관을 따르는 유연한 성향이 강해요.",
    없는: "金은 불필요한 것을 걷어내고 본질만 남기는 결단과 정제의 기운이에요. 의리와 강직함을 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 차갑고 단호한 면보다 따뜻하고 유연한 방식으로 사람들과 관계를 맺는 게 자연스러워요.",
  },
  水: {
    많은: "水는 깊은 곳에서 흘러나오는 지혜와 통찰의 기운이에요. 유연함과 직관을 상징하죠. 당신의 사주에는 이 기운이 넘쳐, 상황을 꿰뚫어 보는 직관과 어떤 환경에도 스며드는 적응력이 있어요. 다만 너무 흘러가기만 하면 방향을 잃을 수 있으니, 자신만의 중심을 세우는 게 중요해요.",
    적당한: "水는 깊은 곳에서 흘러나오는 지혜와 통찰의 기운이에요. 유연함과 직관을 상징하죠. 당신의 사주에는 이 기운이 고르게 있어, 유연한 사고와 공감 능력으로 다양한 상황에 잘 스며들어요.",
    적은: "水는 깊은 곳에서 흘러나오는 지혜와 통찰의 기운이에요. 유연함과 직관을 상징하죠. 당신의 사주에는 이 기운이 적은 편이라, 깊이 사색하기보다 현실적이고 즉각적인 행동을 선호하는 성향이 강해요.",
    없는: "水는 깊은 곳에서 흘러나오는 지혜와 통찰의 기운이에요. 유연함과 직관을 상징하죠. 당신의 사주에는 이 기운이 거의 없어, 막연한 직관보다 경험과 논리를 바탕으로 판단하는 현실적인 성향이 강해요.",
  },
};

export default function ElementStar({ wuXingCount }: Props) {
  const [tipOpen, setTipOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tipOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !tipRef.current?.contains(t)) setTipOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [tipOpen]);
  // 초기 활성값 = 개수가 가장 많은 오행 (동점이면 木→火→土→金→水 순 첫 번째)
  const [activeEl, setActiveEl] = useState<string | null>(
    () => ELEMENTS.reduce((mx, el) => (wuXingCount[el] ?? 0) > (wuXingCount[mx] ?? 0) ? el : mx, ELEMENTS[0] as string)
  );

  const total = Object.values(wuXingCount).reduce((a, b) => a + b, 0);

  // 각 오행 버블의 현재 반지름 (개수에 따라 매번 변함)
  // 전체합 대비 비율을 축 천장(GRAPH_FULL_SHARE)으로 정규화 → 최댓값에 상대적이지 않고 절대 비율 반영
  const bubbleRadii = ELEMENTS.map(el => {
    const fill = total > 0 ? Math.min(1, ((wuXingCount[el] ?? 0) / total) / GRAPH_FULL_SHARE) : 0;
    return MIN_R + fill * (MAX_R - MIN_R);
  });

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
      <div style={{ position: "relative", width: "100%" }}>
        <h3 className="db-section-title">
          오행
          <button
            ref={btnRef}
            type="button"
            onClick={() => setTipOpen(p => !p)}
            aria-label="오행 계산 방식 안내"
            aria-expanded={tipOpen}
            style={{
              background: "rgba(234,203,138,0.15)",
              border: "1px solid rgba(234,203,138,0.4)",
              borderRadius: "50%",
              width: 18, height: 18,
              fontSize: 11,
              color: "var(--saju-gold)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0, flexShrink: 0, lineHeight: 1,
            }}
          >
            ?
          </button>
        </h3>

        {tipOpen && (
          <div ref={tipRef} className="db-tooltip" style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            zIndex: 10, marginTop: 4, fontSize: 13, wordBreak:"keep-all",
          }}>
            사주 8글자 중 지지(8글자 아랫줄)에는 눈에 안 보이는 기운이 숨어 있어요.<br />
            이걸 지장간이라고 하는데, 그 숨은 천간들도 오행 개수에 포함했어요.<br />
            8글자로 볼 때보다 입체적인 오행 분포를 확인할 수 있어요.
          </div>
        )}
      </div>

      {/* 범례 — 生/剋 화살표 색 안내 (그래프 좌상단) */}
      <div
        style={{
          position: "absolute", top: 12, right: 12,
          display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
          fontSize: 12, lineHeight: 1.3, pointerEvents: "none",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.8)" }}>
          <span style={{ color: SHENG_COLOR, fontWeight: 700 }}>→</span> 생(生)
        </span>
        <span style={{ color: "rgba(255,255,255,0.8)" }}>
          <span style={{ color: KE_COLOR, fontWeight: 700 }}>→</span> 극(剋)
        </span>
      </div>

      {/* 그래프 래퍼 — 십성과 동일 높이 박스로 상단 정렬 (아래 설명 박스 높이 균등화) */}
      <div className="db-chart-graph">
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

              {/* 한자 — 비활성 시만 표시 */}
              <text
                x={px}
                y={py + 1}
                fontSize="12"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.95)"
                fontWeight="700"
                style={{
                  pointerEvents: "none",
                  opacity: isActive ? 0 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                {el}
              </text>

              {/* 퍼센트 — 활성 시만 중앙에 표시 */}
              <text
                x={px}
                y={py + 1}
                fontSize="12"
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
      </div>

      {activeEl && (() => {
        const strength = strengthLabel(wuXingCount[activeEl] ?? 0, total);
        return (
          <p className="db-ai-box">
            <b>
              <span style={{ color: WUXING_SVG_COLOR[activeEl] }}>{activeEl}</span> 기운이 {strength} 사주예요.
            </b>
            {ELEMENT_DESC[activeEl][strength]}
          </p>
        );
      })()}
    </section>
  );
}

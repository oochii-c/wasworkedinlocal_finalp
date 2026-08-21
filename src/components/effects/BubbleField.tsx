import { useMemo, type CSSProperties } from "react";
import "./bubbles.css";

/* ============================================================
   BubbleField — 배경 전체에 물방울이 아래에서 위로 떠오르는 효과
   ▼▼▼ 여기 숫자만 바꾸면 튜닝됨 ▼▼▼
   ============================================================ */
const BUBBLE = {
  count: 22,          // 개수: 화면에 동시에 도는 방울 수
  riseSec: [9, 20],   // 속도: 아래→위 올라오는 시간(초) [최소, 최대]. 작을수록 빠름
  sizePx: [5, 20],    // 크기: 지름(px) [최소, 최대]
  opacity: 0.5,       // 최대 투명도 (0~1)
};
/* ▲▲▲ 여기까지 ▲▲▲ */

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export default function BubbleField() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE.count }, () => ({
        left: rand(0, 100),                              // 가로 위치 %
        size: rand(BUBBLE.sizePx[0], BUBBLE.sizePx[1]),  // 지름 px
        dur: rand(BUBBLE.riseSec[0], BUBBLE.riseSec[1]),  // 상승 시간 s
        delay: -rand(0, BUBBLE.riseSec[1]),              // 음수 딜레이 = 시작부터 흩뿌려짐
        drift: rand(-40, 40),                            // 좌우 흔들림 px
      })),
    [],
  );

  return (
    <div className="bubble-field" aria-hidden="true">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            "--drift": `${b.drift}px`,
            "--bubble-opacity": BUBBLE.opacity,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

import { useState } from "react";
import "./wish.css";
import BottomNav from "../../components/layout/BottomNav";
import BubbleField from "../../components/effects/BubbleField";
import { DragonMotion, type DragonAssets } from "../../components/effects/DragonMotion";
import { useDragonMotion } from "../../components/effects/useDragonMotion";
import { useSaju } from "../../state/SajuContext";
import { loadWishes, addWish, type WishRecord } from "./wishStore";

/* 파츠 에셋은 public/ 아래 절대경로. 레이어 좌표는 DragonMotion.css 가 들고 있다. */
const DRAGON: DragonAssets = {
  maneBack: "/dragon/dragon_hair_00.webp",
  tail: "/dragon/dragon_body_01.webp",
  body: "/dragon/dragon_body.webp",
  head: "/dragon/dragon_head_default_00.webp",
  headFire: "/dragon/dragon_head_opened.webp",
  armLeft: "/dragon/dragon_arm_l.webp",
  armRight: "/dragon/dragon_arm_r.webp",
  waterFx: "/fire/fire_splashed_00.webp",
  flameFrames: [
    "/fire/fire_spitted_00.webp",
    "/fire/fire_spitted_01.webp",
    "/fire/fire_spitted_02.webp",
    "/fire/fire_spitted_03.webp",
    "/fire/fire_spitted_04.webp",
  ],
  orb: {
    frames: ["/orb/wish_00.webp", "/orb/wish_01.webp", "/orb/wish_02.webp"],
    ring: "/orb/wish_04.webp",
    ripple: "/orb/wish_05.webp",
    sparkles: "/orb/wish_07.webp",
    trails: ["/orb/wish_effect_01.webp", "/orb/wish_effect_02.webp"],
    flash: "/orb/wish_03.webp",
    aura: "/orb/wish_06.webp",
  },
};

const LABELS = {
  idle: "무엇을 빌겠느냐",
  listening: "마음을 듣는 중",
  wish: "소원을 밝히는 중",
  burn: "액운을 맡기는 중",
  complete: "의식 완료",
};

const fmt = (at: number) =>
  new Date(at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

interface WishProps {
  onSelect?: (id: string) => void;
}

export default function Wish({ onSelect }: WishProps) {
  const { chart, navigate } = useSaju();
  const motion = useDragonMotion();
  const sig = chart ? chart.baZi.join("") : "";

  const [text, setText] = useState("");
  // 태우는 글은 저장하지 않으므로, 재생 중 보여줄 문구만 따로 붙든다.
  const [burning, setBurning] = useState("");
  const [past, setPast] = useState<WishRecord[] | null>(null);

  const busy = motion.state !== "idle";
  const empty = text.trim().length === 0;

  const onWish = () => {
    if (busy || empty) return;
    addWish(sig, text.trim());
    setText("");
    setBurning("");
    motion.playWish();
  };

  const onBurn = () => {
    if (busy || empty) return;
    setBurning(text.trim());
    setText("");
    motion.playBurn();
  };

  return (
    <div className="db-page wi-page">
      <BubbleField />

      <header className="db-topbar">
        <button
          type="button"
          className="db-back-arrow"
          onClick={() => navigate("home")}
          aria-label="용궁 홈으로 돌아가기"
        >
          ←
        </button>
      </header>

      <div className="wi-stage">
        <div className="wi-water" />

        <p className="wi-state">{LABELS[motion.state]}</p>

        <DragonMotion
          state={motion.state}
          assets={DRAGON}
          size="min(54vw, 252px)"
          burnText={burning || undefined}
        />

        <input
          className="wi-input"
          type="text"
          value={text}
          maxLength={40}
          disabled={busy}
          placeholder="이루고 싶은 소원, 내려놓고 싶은 기억"
          aria-label="이루고 싶은 소원 또는 내려놓고 싶은 기억"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onWish();
          }}
        />

        <nav className="wi-controls" aria-label="의식 선택">
          <button
            type="button"
            className="wi-btn wi-btn--wish"
            onClick={onWish}
            disabled={busy || empty}
          >
            소원 빌기
          </button>
          <button
            type="button"
            className="wi-btn wi-btn--burn"
            onClick={onBurn}
            disabled={busy || empty}
          >
            액운 맡기기
          </button>
          <button
            type="button"
            className="wi-btn wi-btn--past"
            onClick={() => setPast(loadWishes(sig))}
          >
            지난 소원
          </button>
        </nav>
      </div>

      {past && (
        <div className="wi-sheet-back" onClick={() => setPast(null)} role="presentation">
          <div
            className="wi-sheet"
            role="dialog"
            aria-label="지난 소원"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="wi-sheet-title">지난 소원</h2>
            {past.length === 0 ? (
              <p className="wi-sheet-empty">아직 빌었던 소원이 없습니다.</p>
            ) : (
              <ul className="wi-sheet-list">
                {past.map((w) => (
                  <li key={w.at}>
                    <span className="wi-sheet-text">{w.text}</span>
                    <time className="wi-sheet-date">{fmt(w.at)}</time>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="wi-sheet-close" onClick={() => setPast(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      <BottomNav active="wishes" onSelect={onSelect} />
    </div>
  );
}

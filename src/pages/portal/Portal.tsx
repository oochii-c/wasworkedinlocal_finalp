import { useState } from "react";
import "./portal.css";
import { useSaju } from "../../state/SajuContext";
import { SPOTS, type Spot } from "./spots";

export default function Portal() {
  const { inputs, navigate } = useSaju();
  const [sheet, setSheet] = useState<Spot | null>(null);
  // 캡션은 호버/포커스한 랜드마크의 것만 띄운다. 버튼과 캡션이 별도 레이어라 CSS로는 못 엮음.
  const [hot, setHot] = useState<string | null>(null);

  const onSpot = (s: Spot) => {
    if (s.soon) return;
    if (s.sheet) { setSheet(s); return; }
    if (s.target) navigate(s.target);
  };

  return (
    <div className="pt-page">
      <div className="pt-canvas">
        {inputs?.name && <p className="pt-greet">{inputs.name} 님, 용궁에 오셨습니다</p>}

        {SPOTS.map((s) => {
          const [l, t, w, h] = s.box;
          return (
            <button
              key={s.key}
              type="button"
              className={`pt-spot${s.soon ? " is-soon" : ""}`}
              style={{
                left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`,
                clipPath: s.clip,
                backgroundImage: `url(${s.art})`,
              }}
              onClick={() => onSpot(s)}
              onMouseEnter={() => setHot(s.key)}
              onMouseLeave={() => setHot((k) => (k === s.key ? null : k))}
              onFocus={() => setHot(s.key)}
              onBlur={() => setHot((k) => (k === s.key ? null : k))}
              aria-disabled={s.soon || undefined}
              aria-label={s.soon ? `${s.label} — 준비 중` : s.label}
            />
          );
        })}

        {/* 캡션은 클립 밖 별도 레이어 — 버튼에 clip-path가 걸려 있어 안에 두면 잘린다 */}
        <div className="pt-caps" aria-hidden="true">
          {SPOTS.map((s) => (
            <span
              key={s.key}
              className={`pt-cap${s.soon ? " is-soon" : ""}${hot === s.key ? " is-on" : ""}`}
              style={{ left: `${s.cap[0]}%`, top: `${s.cap[1]}%` }}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {sheet && (
        <div className="pt-sheet-back" onClick={() => setSheet(null)} role="presentation">
          <div
            className="pt-sheet"
            role="dialog"
            aria-label={`${sheet.label} 선택`}
            onClick={(e) => e.stopPropagation()}
          >
            {sheet.sheet?.map((o) => (
              <button key={o.target} type="button" className="pt-sheet-btn" onClick={() => navigate(o.target)}>
                {o.label}
              </button>
            ))}
            <button type="button" className="pt-sheet-cancel" onClick={() => setSheet(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

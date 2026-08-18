import { useState } from "react";

interface ShenSha {
  name: string;
  desc: string;
}

interface Props {
  shenSha: ShenSha[];
}

export default function ShenShaList({ shenSha }: Props) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <section className="db-section" aria-label="신살">
      <h3 className="db-section-title">
        내 신살과 길성
        <span className="db-section-sub">가진 것만</span>
      </h3>

      {shenSha.length === 0 ? (
        <p className="db-shensha-empty">특별한 신살 없음 · 평탄한 사주</p>
      ) : (
        <div className="db-badges">
          {shenSha.map(({ name, desc }) => (
            <button
              key={name}
              type="button"
              className={`db-badge${tooltip === name ? " is-active" : ""}`}
              onClick={() => setTooltip(prev => prev === name ? null : name)}
              aria-label={`${name}: ${desc}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {tooltip && (() => {
        const found = shenSha.find(s => s.name === tooltip);
        return found ? (
          <div className="db-tooltip" role="tooltip">
            <strong>{found.name}</strong> — {found.desc}
          </div>
        ) : null;
      })()}
    </section>
  );
}

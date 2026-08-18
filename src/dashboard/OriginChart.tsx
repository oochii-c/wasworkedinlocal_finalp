import { type Pillar } from "../saju";
import { WUXING_BG, WUXING_BORDER, WUXING_TEXT, HANJA_DOK } from "./constants";

interface Props {
  pillars: Pillar[];
}

// 오행 문자 추출 (wuXing은 "木火" 형태 — 첫 글자=천간, 두번째=지지)
function wuXingOf(wx: string, idx: 0 | 1): string {
  return wx?.[idx] ?? "?";
}

// 순서: 시→일→월→연 (와이어프레임 기준)
const PILLAR_ORDER = [3, 2, 1, 0] as const; // 인덱스: 시,일,월,연
const PILLAR_LABELS = ["시", "일", "월", "연"];

export default function OriginChart({ pillars }: Props) {
  const ordered = PILLAR_ORDER.map(i => pillars[i]);

  return (
    <section className="db-section" aria-label="사주 원국 8글자">
      <h3 className="db-section-title">내 사주 8글자</h3>
      <div className="db-wongook-grid">
        {/* 헤더: 시 일 월 연 */}
        {PILLAR_LABELS.map(lbl => (
          <div key={lbl} className="db-wg-head">{lbl}</div>
        ))}

        {/* 천간 행 */}
        {ordered.map((p, i) => {
          const wx = wuXingOf(p?.wuXing ?? "", 0);
          const gan = p?.gan ?? "?";
          const dok = HANJA_DOK[gan] || "";
          return (
            <div
              key={`gan-${i}`}
              className="db-wg-cell"
              style={{ background: WUXING_BG[wx], borderColor: WUXING_BORDER[wx] }}
              aria-label={`${PILLAR_LABELS[i]}주 천간 ${gan}`}
            >
              <div className="db-wg-hanja-box">
                <span className="db-wg-hanja" style={{ color: WUXING_TEXT[wx] }}>{gan}</span>
                {dok && <span className="db-wg-dok">{dok}</span>}
              </div>
            </div>
          );
        })}

        {/* 지지 행 */}
        {ordered.map((p, i) => {
          const wx = wuXingOf(p?.wuXing ?? "", 1);
          const zhi = p?.zhi ?? "?";
          const dok = HANJA_DOK[zhi] || "";
          return (
            <div
              key={`zhi-${i}`}
              className="db-wg-cell"
              style={{ background: WUXING_BG[wx], borderColor: WUXING_BORDER[wx] }}
              aria-label={`${PILLAR_LABELS[i]}주 지지 ${zhi}`}
            >
              <div className="db-wg-hanja-box">
                <span className="db-wg-hanja" style={{ color: WUXING_TEXT[wx] }}>{zhi}</span>
                {dok && <span className="db-wg-dok">{dok}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

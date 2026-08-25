import { useMemo, useState } from "react";
import "../styles/saju.css";
import "./machi.css";
import { computeSaju, computeSajuExtended, type SajuExtended, type SajuChart } from "../saju";
import {
  SectionHeader,
  SajuTextInput,
  DateInputGroup,
  SubmitButton,
  type SajuDateValue,
} from "../components/form";

/* ============================================================
   machi.tsx - 귀인지도 (궁합 페이지)
   "나"는 이미 계산된 chart(SajuExtended)를 prop으로 받고,
   상대방 생년월일만 입력받아 지도에 추가하는 방식.
   ============================================================ */

const ELEMENT_HANJA = ["木", "火", "土", "金", "水"]; // wood,fire,earth,metal,water
const BRANCH_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function mod(n: number, m: number) { return ((n % m) + m) % m; }

function dayElementBranch(chart: SajuChart) {
  const day = chart.pillars.find((p) => p.key === "일");
  return {
    elIdx: day ? ELEMENT_HANJA.indexOf(day.wuXing[0]) : -1,
    branchIdx: day ? BRANCH_HANJA.indexOf(day.zhi) : -1,
  };
}

/* ============================================================
   궁합 로직
   ============================================================ */
// 상생: 목(0)->화(1)->토(2)->금(3)->수(4)->목(0)
const generates = (el: number) => mod(el + 1, 5);
// 상극: 목(0)극토(2), 토(2)극수(4), 수(4)극화(1), 화(1)극금(3), 금(3)극목(0)
const CONTROL_MAP: Record<number, number> = { 0: 2, 2: 4, 4: 1, 1: 3, 3: 0 };
const controls = (el: number) => CONTROL_MAP[el];

const HAP_PAIRS = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]]; // 육합
const CHUNG_PAIRS = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]; // 충

function isPair(list: number[][], a: number, b: number) {
  return list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

// 순서 = 하단 통계 탭 노출 순서 (귀인 / 단짝 / 내 사람 / 오른팔 / 호랑이 선생)
type RelationType = "gwiin" | "donghaeng" | "oreunpal" | "horangi" | "jageuk";

const ROLE_INFO: Record<RelationType, { label: string; emoji: string; desc: string; base: number; color: string; badgePos: string }> = {
  gwiin: { label: "귀인", emoji: "🌟", desc: "결정적인 순간 나를 도와주는, 하늘이 붙여준 사람", base: 92, color: "#7CE3A0", badgePos: "top" },
  donghaeng: { label: "단짝", emoji: "🤝", desc: "결이 같아서 편하게 붙어다니는 사이", base: 68, color: "#E8C97A", badgePos: "right" },
  oreunpal: { label: "내 사람", emoji: "🌱", desc: "내가 마음 쓰고 챙기게 되는, 아끼는 인연", base: 82, color: "#D9A9F0", badgePos: "bottom-right" },
  horangi: { label: "오른팔", emoji: "💪", desc: "내가 이끌면 든든하게 따라주는 조합", base: 58, color: "#9AA3B5", badgePos: "bottom-left" },
  jageuk: { label: "호랑이 선생", emoji: "⚡", desc: "나를 단련시키는, 부딪히며 성장하게 하는 인연", base: 48, color: "#E88070", badgePos: "left" },
};

function getRelationType(ownerEl: number, otherEl: number): RelationType {
  if (ownerEl === otherEl) return "donghaeng";
  if (generates(ownerEl) === otherEl) return "oreunpal";
  if (generates(otherEl) === ownerEl) return "gwiin";
  if (controls(ownerEl) === otherEl) return "horangi";
  return "jageuk";
}

function calcCompatibility(ownerEl: number, ownerBranch: number, otherEl: number, otherBranch: number) {
  const type = getRelationType(ownerEl, otherEl);
  let score = ROLE_INFO[type].base;
  if (isPair(HAP_PAIRS, ownerBranch, otherBranch)) score += 8;
  if (isPair(CHUNG_PAIRS, ownerBranch, otherBranch)) score -= 8;
  score = Math.max(20, Math.min(99, score));
  return { type, score };
}

/* ============================================================
   UI
   ============================================================ */
interface Participant {
  id: string;
  name: string;
  elIdx: number;
  relationType: RelationType;
  score: number;
}

// 별자리 배경용 고정 점 위치 (매 렌더 동일하게)
const STAR_DOTS = [
  [30, 40, 1.2], [90, 20, 0.9], [150, 55, 1], [230, 15, 0.8], [300, 35, 1.3],
  [360, 60, 0.9], [20, 140, 0.8], [370, 150, 1], [40, 300, 1], [360, 310, 0.9],
  [80, 350, 1.1], [320, 355, 0.8], [200, 25, 0.9], [10, 220, 1], [385, 240, 0.9],
] as const;

interface MapDiagramProps {
  participants: Participant[];
  large?: boolean;
  onClick?: () => void;
}

function MapDiagram({ participants, large, onClick }: MapDiagramProps) {
  const cx = 200, cy = 195;
  const n = Math.max(participants.length, 1);
  const R_MIN = 60, R_MAX = 165;

  const scoreToRadius = (score: number) => R_MAX - ((score - 20) / (99 - 20)) * (R_MAX - R_MIN);

  return (
    <div
      className={`machi-map-card${large ? " machi-map-card--large" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      <svg viewBox="0 0 400 390" className="machi-map-diagram" role="img" aria-label="귀인지도">
        <defs>
          <radialGradient id="machiOwnerGradient" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F5EFD8" />
            <stop offset="100%" stopColor="#D8C58A" />
          </radialGradient>
          {Object.entries(ROLE_INFO).map(([key, r]) => (
            <radialGradient key={key} id={`machiNodeGradient-${key}`} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor={r.color} />
              <stop offset="100%" stopColor={r.color} stopOpacity="0.55" />
            </radialGradient>
          ))}
        </defs>

        {STAR_DOTS.map(([sx, sy, sr], i) => (
          <circle key={"star" + i} cx={sx} cy={sy} r={sr} className="machi-star" />
        ))}
        <circle cx={cx} cy={cy} r={70} className="machi-orbit-ring" />
        <circle cx={cx} cy={cy} r={115} className="machi-orbit-ring" />
        <circle cx={cx} cy={cy} r={160} className="machi-orbit-ring" />

        {participants.map((p, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const r = scoreToRadius(p.score);
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const role = ROLE_INFO[p.relationType];
          return (
            <line
              key={"l" + p.id}
              x1={cx} y1={cy} x2={x} y2={y}
              className="machi-map-line"
              style={{ stroke: role.color }}
            />
          );
        })}

        <circle cx={cx} cy={cy} r={46} className="machi-owner-glow" />
        <circle cx={cx} cy={cy} r={30} className="machi-owner-node" />
        <ellipse cx={cx - 10} cy={cy - 12} rx={9} ry={6} className="machi-bead-shine" />
        <text x={cx} y={cy + 6} textAnchor="middle" className="machi-owner-node-text">나</text>

        {participants.map((p, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const r = scoreToRadius(p.score);
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const role = ROLE_INFO[p.relationType];
          const glowOpacity = 0.35 + ((p.score - 20) / (99 - 20)) * 0.4;
          return (
            <g key={"n" + p.id}>
              <circle cx={x} cy={y} r={27} className="machi-part-glow" style={{ fill: role.color, opacity: glowOpacity }} />
              <circle cx={x} cy={y} r={21} fill={`url(#machiNodeGradient-${p.relationType})`} className="machi-part-node" />
              <ellipse cx={x - 7} cy={y - 8} rx={6} ry={4} className="machi-bead-shine" />
              <text x={x} y={y + 7} textAnchor="middle" className="machi-part-node-text">{role.emoji}</text>
              <rect x={x - 30} y={y + 28} width={60} height={16} rx={8} className="machi-part-name-bg" />
              <text x={x} y={y + 39} textAnchor="middle" className="machi-part-node-name">{p.name}</text>
            </g>
          );
        })}
      </svg>

      {Object.entries(ROLE_INFO).map(([key, r]) => {
        const count = participants.filter((p) => p.relationType === key).length;
        return (
          <span key={key} className={`machi-badge machi-badge-${r.badgePos}`} style={{ color: r.color, borderColor: r.color }}>
            {r.emoji} {r.label} {count}
          </span>
        );
      })}

      <p className="machi-map-caption">달에 가까울수록, 별이 밝을수록 케미가 좋은 사람</p>
    </div>
  );
}

interface MachiProps {
  chart?: SajuExtended;
}

export default function Machi({ chart }: MachiProps) {
  const fallbackChart = useMemo(() => computeSajuExtended({
    gender: "female",
    calendarType: "solar",
    date: { year: 1995, month: 8, day: 20 },
    time: { hour: 12, minute: 0 },
    timeUnknown: true,
  }), []);
  const ownerChart = chart ?? fallbackChart;

  const [friendName, setFriendName] = useState("");
  const [friendDate, setFriendDate] = useState<SajuDateValue>({ year: 0, month: 0, day: 0 });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState("");
  const [showFullMap, setShowFullMap] = useState(false);

  const canSubmit = !!friendName.trim() && !!friendDate.year && !!friendDate.month && !!friendDate.day;

  const handleAddFriend = () => {
    let friendChart: SajuChart;
    try {
      friendChart = computeSaju({
        gender: "female",
        calendarType: "solar",
        date: friendDate,
        time: { hour: 12, minute: 0 },
        timeUnknown: true,
      });
    } catch {
      setError("해당 날짜로 원국을 만들 수 없습니다. 날짜를 확인해 주세요.");
      return;
    }

    const owner = dayElementBranch(ownerChart);
    const friend = dayElementBranch(friendChart);
    const { type, score } = calcCompatibility(owner.elIdx, owner.branchIdx, friend.elIdx, friend.branchIdx);

    setParticipants((prev) => [
      ...prev,
      {
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: friendName.trim(),
        elIdx: friend.elIdx,
        relationType: type,
        score,
      },
    ]);
    setError("");
    setFriendName("");
    setFriendDate({ year: 0, month: 0, day: 0 });
  };

  return (
    <div className="saju-page machi-page">
      <header className="saju-header machi-gate">
        <h1>귀인지도</h1>
        <p>나를 중심으로 친구들과의 궁합을 지도로 모아봐요</p>
      </header>

      <section className="saju-section">
        <SectionHeader title="상대방 이름" />
        <SajuTextInput value={friendName} onChange={setFriendName} placeholder="예: 지수" icon="🐚" />

        <div style={{ height: "0.9rem" }} />

        <SectionHeader title="상대방 생년월일" sub="양력" />
        <DateInputGroup value={friendDate} onChange={setFriendDate} />

        {error && <div className="saju-info-error">{error}</div>}

        <div style={{ height: "1rem" }} />
        <SubmitButton label="궁합 보기" disabled={!canSubmit} onClick={handleAddFriend} />
      </section>

      {participants.length > 0 && (
        <>
          <SectionHeader title="관계 지도" sub={`${participants.length + 1}명`} />
          <MapDiagram participants={participants} onClick={() => setShowFullMap(true)} />
          <p className="machi-map-hint">지도를 누르면 크게 볼 수 있어요</p>

          <div className="machi-stat-row">
            {Object.entries(ROLE_INFO).map(([key, r]) => {
              const count = participants.filter((p) => p.relationType === key).length;
              return (
                <div className="machi-stat-tile" key={key}>
                  <div className="machi-stat-num" style={{ color: r.color }}>{count}</div>
                  <div className="machi-stat-label">{r.emoji} {r.label}</div>
                </div>
              );
            })}
          </div>

          <SubmitButton label="처음부터 다시" onClick={() => setParticipants([])} />
        </>
      )}

      <p className="machi-disclaimer">
        궁합 점수는 두 사람의 일간(日干)·일지(日支) 오행 관계를 단순화해 계산한 재미 콘텐츠입니다.
        실제 인간관계나 궁합을 결정하는 절대적 기준이 아니니 참고만 해주세요.
      </p>

      {showFullMap && (
        <div className="saju-modal-overlay" onClick={() => setShowFullMap(false)}>
          <div className="saju-modal machi-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="saju-modal-header">
              <h4>관계 지도</h4>
              <button type="button" className="saju-modal-close" onClick={() => setShowFullMap(false)} aria-label="닫기">✕</button>
            </div>
            <MapDiagram participants={participants} large />
          </div>
        </div>
      )}
    </div>
  );
}

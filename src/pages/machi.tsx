import { useMemo, useState } from "react";
import "../styles/saju.css";
import "./machi.css";
import resetIcon from "../assets/icons/reset_whirl.svg";
import { computeSaju, computeSajuExtended, type SajuExtended, type SajuChart } from "../saju";
import {
  SectionHeader,
  SajuTextInput,
  PillToggleGroup,
  DateInputGroup,
  TimeInputGroup,
  SubmitButton,
  type PillOption,
  type SajuDateValue,
  type SajuTimeValue,
} from "../components/form";

/* ============================================================
   machi.tsx - 귀인지도 (궁합 페이지)
   "나"는 이미 계산된 chart(SajuExtended)를 prop으로 받고,
   상대방 생년월일만 입력받아 지도에 추가하는 방식.
   ============================================================ */

const CALENDAR_BASE_OPTIONS: PillOption[] = [
  { value: "solar", label: "양력" },
  { value: "lunar", label: "음력" },
];
const LEAP_OPTIONS: PillOption[] = [
  { value: "normal", label: "평달" },
  { value: "leap", label: "윤달" },
];
function toCalendarType(calendarBase: string, isLeapMonth: boolean) {
  return calendarBase === "solar" ? "solar" : isLeapMonth ? "leap-month" : "lunar";
}

const ELEMENT_HANJA = ["木", "火", "土", "金", "水"]; // wood,fire,earth,metal,water
const ELEMENT_KR = ["목(나무)", "화(불)", "토(흙)", "금(쇠)", "수(물)"];
const ELEMENT_KR_SHORT = ["목", "화", "토", "금", "수"];
const ELEMENT_EMOJI = ["🌱", "🔥", "⛰️", "⚙️", "💧"];
const ELEMENT_COLOR = ["#7CE3A0", "#E88070", "#E8C97A", "#B7C0DE", "#7FC1E8"];

// 오행 레이더차트 좌표 계산 (목화토금수 5축, 12시 방향에서 시계방향)
function radarPoint(idx: number, value: number, cx: number, cy: number, maxR: number, maxValue: number) {
  const angle = -Math.PI / 2 + idx * ((Math.PI * 2) / 5);
  const r = 6 + (Math.min(value, maxValue) / maxValue) * (maxR - 6);
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
// 팔각 컷 보석 좌표 (나 노드)
function gemVertex(cx: number, cy: number, r: number, sides: number, startDeg: number, i: number) {
  const angle = ((startDeg + (i * 360) / sides) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
function gemPoints(cx: number, cy: number, r: number, sides: number, startDeg: number) {
  return Array.from({ length: sides })
    .map((_, i) => {
      const p = gemVertex(cx, cy, r, sides, startDeg, i);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

function pentagonPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 5 })
    .map((_, i) => {
      const angle = -Math.PI / 2 + i * ((Math.PI * 2) / 5);
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}

// 일간 오행 기질 - 사주유형(계절x낮밤) 위에 얹어서 40종(8x5)으로 확장
const ELEMENT_TRAIT = [
  { trait: "성장형 기질", desc: "가만히 있지 못하고 늘 뻗어나가려는 기운이에요" },
  { trait: "발산형 기질", desc: "감정과 열정을 감추지 못하고 확 드러내는 기운이에요" },
  { trait: "중심형 기질", desc: "흔들림 없이 자리를 지키며 주변을 든든하게 받쳐주는 기운이에요" },
  { trait: "결단형 기질", desc: "맺고 끊음이 분명하고 원칙을 중요하게 여기는 기운이에요" },
  { trait: "유연형 기질", desc: "상황에 맞춰 부드럽게 흐르며 적응하는 기운이에요" },
];
const BRANCH_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function mod(n: number, m: number) { return ((n % m) + m) % m; }

function countElements(chart: SajuChart): number[] {
  const counts = [0, 0, 0, 0, 0];
  chart.pillars.forEach((p) => {
    const idx = ELEMENT_HANJA.indexOf(p.wuXing[0]);
    if (idx >= 0) counts[idx]++;
  });
  return counts;
}

function buildElementBalanceInsight(counts: number[]) {
  let strongIdx = 0, weakIdx = 0;
  for (let i = 1; i < 5; i++) {
    if (counts[i] > counts[strongIdx]) strongIdx = i;
    if (counts[i] < counts[weakIdx]) weakIdx = i;
  }
  return {
    text: `사주엔 ${ELEMENT_KR[strongIdx]} 기운이 많고 ${ELEMENT_KR[weakIdx]} 기운이 적어요 — ${ELEMENT_KR[weakIdx]} 기운 친구가 특히 귀한 구성이에요.`,
    weakEmoji: ELEMENT_EMOJI[weakIdx],
  };
}

/* ============================================================
   기운 인사이트 - 오너 기준 오행 생/극 방향(밖으로 나가는지, 안으로 들어오는지)
   + 오너를 채워주는(생해주는) 오행 요약
   ============================================================ */
function buildEnergyInsight(ownerElIdx: number, participants: Participant[]) {
  const outgoing = participants.filter((p) => p.relationType === "oreunpal").length; // 내가 챙기고 이끄는 사람
  const incoming = participants.filter((p) => p.relationType === "gwiin").length; // 나를 채워주는 사람
  const fillElIdx = mod(ownerElIdx - 1, 5); // generates(fillElIdx) === ownerElIdx

  let directionText: string;
  if (outgoing > incoming) {
    directionText = "기운이 밖으로 나가는 모양의 지도예요 — 내가 챙기고 이끄는 사람이 많다는 건 그만큼 힘을 쓰고 있다는 뜻이에요.";
  } else if (incoming > outgoing) {
    directionText = "기운이 안으로 들어오는 모양의 지도예요 — 나를 채워주는 사람이 많다는 건 그만큼 든든하게 받쳐주고 있다는 뜻이에요.";
  } else {
    directionText = "기운이 안팎으로 고르게 오가는 지도예요 — 주고받는 균형이 잘 맞는 편이에요.";
  }

  return {
    directionText,
    fillEmoji: ELEMENT_EMOJI[fillElIdx],
    fillName: ELEMENT_KR[fillElIdx],
    fillColor: ELEMENT_COLOR[fillElIdx],
  };
}

/* ============================================================
   성격 유형 (계절 x 낮/밤 조합, 8종)
   월지 -> 계절, 시지 -> 낮/밤
   ============================================================ */
const SPRING_BRANCH = ["寅", "卯", "辰"];
const SUMMER_BRANCH = ["巳", "午", "未"];
const AUTUMN_BRANCH = ["申", "酉", "戌"];
const WINTER_BRANCH = ["亥", "子", "丑"];
const DAY_BRANCH = ["卯", "辰", "巳", "午", "未", "申"];

interface Archetype { emoji: string; name: string; desc: string; }

const ARCHETYPES: Record<string, Archetype> = {
  "봄-낮": { emoji: "🐚", name: "봄 낮빛형", desc: "따스한 빛을 받아 자연스레 피어나는 사람" },
  "봄-밤": { emoji: "🫧", name: "봄 밤안개형", desc: "포근한 안개처럼 은은하게 스며드는 사람" },
  "여름-낮": { emoji: "🐠", name: "여름 한낮형", desc: "뜨겁게 타오르며 존재감을 드러내는 사람" },
  "여름-밤": { emoji: "🐬", name: "여름 밤바람형", desc: "시원하게 훅 불어와 분위기를 바꾸는 사람" },
  "가을-낮": { emoji: "🪸", name: "가을 낮볕형", desc: "따뜻한 볕처럼 잔잔하게 곁을 지키는 사람" },
  "가을-밤": { emoji: "🦪", name: "가을 밤비형", desc: "조용히 스며들어 어느새 다 적셔놓는 사람" },
  "겨울-낮": { emoji: "💎", name: "겨울 낮눈형", desc: "소복소복 쌓이듯 꾸준하게 곁에 남는 사람" },
  "겨울-밤": { emoji: "🔱", name: "겨울 밤별형", desc: "차갑고 맑은 밤하늘처럼 또렷하게 빛나는 사람" },
};

function deriveArchetype(chart: SajuChart): Archetype {
  const month = chart.pillars.find((p) => p.key === "월");
  const timePillar = chart.pillars.find((p) => p.key === "시");
  const monthZhi = month?.zhi ?? "";
  const timeZhi = timePillar?.zhi ?? "";

  const season = SPRING_BRANCH.includes(monthZhi) ? "봄"
    : SUMMER_BRANCH.includes(monthZhi) ? "여름"
    : AUTUMN_BRANCH.includes(monthZhi) ? "가을"
    : WINTER_BRANCH.includes(monthZhi) ? "겨울"
    : "봄";
  const dayNight = DAY_BRANCH.includes(timeZhi) ? "낮" : "밤";

  return ARCHETYPES[`${season}-${dayNight}`];
}

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
type RelationType = "gwiin" | "danjjak" | "oreunpal" | "horangi" | "jageuk";

const ROLE_INFO: Record<RelationType, { label: string; emoji: string; desc: string; caution: string; base: number; color: string }> = {
  gwiin: { label: "회장님", emoji: "👑", desc: "챙겨야할 존재", caution: "받기만 하면 서운해질 수 있어요, 가끔은 나도 먼저 손을 내밀어보세요", base: 92, color: "#6FE0C0" },
  danjjak: { label: "단짝", emoji: "🙏", desc: "일지가 똑같은 찐친", caution: "너무 편해서 소중함을 잊지 않게, 가끔은 마음을 표현해주세요", base: 90, color: "#FF9ED8" },
  oreunpal: { label: "PT쌤", emoji: "🏋️‍♂️", desc: "지혜의 귀인", caution: "내가 너무 많이 챙기면 지칠 수 있어요, 가끔은 기대도 괜찮아요", base: 82, color: "#C9A6F5" },
  horangi: { label: "혐관", emoji: "⚡", desc: "운을 방해하는 존재", caution: "무리해서 맞추려 하지 마세요, 그냥 다른 리듬일 뿐이에요", base: 58, color: "#7FA8D9" },
  jageuk: { label: "키링", emoji: "🐣", desc: "매력적인 귀인", caution: "부딪히는 게 나쁜 건 아니에요, 다만 감정 소모되지 않게 거리 조절을", base: 48, color: "#F08585" },
};

// 뱃지 5개를 회장님(위)을 기준으로 72도씩 균등하게 원형 배치
const BADGE_ANGLE_DEG: Record<RelationType, number> = {
  gwiin: -90,
  danjjak: -18,
  oreunpal: 54,
  horangi: 126,
  jageuk: 198,
};

// 같은 관계타입 참여자가 여러 명일 때 겹치지 않게 좌우로 살짝 벌려주는 오프셋(핑퐁 순서)
function jitterStep(n: number) {
  if (n === 0) return 0;
  const k = Math.ceil(n / 2);
  const sign = n % 2 === 1 ? 1 : -1;
  return sign * k * 16;
}

function nodeAngle(relationType: RelationType, sameTypeIndex: number) {
  const deg = BADGE_ANGLE_DEG[relationType] + jitterStep(sameTypeIndex);
  return (deg * Math.PI) / 180;
}

function getRelationType(ownerEl: number, otherEl: number): RelationType {
  if (ownerEl === otherEl) return "gwiin";
  if (generates(ownerEl) === otherEl) return "oreunpal";
  if (generates(otherEl) === ownerEl) return "gwiin";
  if (controls(ownerEl) === otherEl) return "horangi";
  return "jageuk";
}

function calcCompatibility(ownerEl: number, ownerBranch: number, otherEl: number, otherBranch: number) {
  const type = ownerBranch === otherBranch ? "danjjak" : getRelationType(ownerEl, otherEl);
  const hap = isPair(HAP_PAIRS, ownerBranch, otherBranch);
  const chung = isPair(CHUNG_PAIRS, ownerBranch, otherBranch);
  let score = ROLE_INFO[type].base;
  if (hap) score += 8;
  if (chung) score -= 8;
  score = Math.max(20, Math.min(99, score));
  return { type, score, hap, chung };
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
  hap: boolean;
  chung: boolean;
  archetype: Archetype;
  elementCounts: number[];
  angle: number;
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

const BADGE_LABEL_RADIUS = 162;

function MapDiagram({ participants, large, onClick }: MapDiagramProps) {
  const cx = 200, cy = 195;
  const R_MIN = 55, R_MAX = 155;

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
            <stop offset="35%" stopColor="#F5EFD8" />
            <stop offset="70%" stopColor="#E0B8F0" />
            <stop offset="100%" stopColor="#7FC1E8" />
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
          <circle key={"bubble" + i} cx={sx} cy={sy} r={sr * 1.6} className="machi-bubble" style={{ animationDelay: `${(i % 6) * 0.7}s` }} />
        ))}
        <circle cx={cx} cy={cy} r={70} className="machi-ripple" style={{ animationDelay: "0s" }} />
        <circle cx={cx} cy={cy} r={115} className="machi-ripple" style={{ animationDelay: "1.2s" }} />
        <circle cx={cx} cy={cy} r={160} className="machi-ripple" style={{ animationDelay: "2.4s" }} />

        {participants.map((p) => {
          const angle = p.angle;
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

        <circle cx={cx} cy={cy} r={58} className="machi-owner-glow" />
        <polygon points={gemPoints(cx, cy, 38, 8, -90)} fill="url(#machiOwnerGradient)" className="machi-owner-node" />
        <polygon points={gemPoints(cx, cy, 20, 8, -67.5)} className="machi-owner-gem-table" />
        {Array.from({ length: 8 }).map((_, i) => {
          const outer = gemVertex(cx, cy, 38, 8, -90, i);
          const inner = gemVertex(cx, cy, 20, 8, -67.5, i);
          return <line key={"facet" + i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="machi-owner-facet" />;
        })}
        <ellipse cx={cx - 12} cy={cy - 15} rx={10} ry={6} className="machi-bead-shine" />
        <text x={cx} y={cy + 6} textAnchor="middle" className="machi-owner-node-text">나</text>

        {participants.map((p, i) => {
          const angle = p.angle;
          const r = scoreToRadius(p.score);
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const role = ROLE_INFO[p.relationType];
          const glowOpacity = 0.35 + ((p.score - 20) / (99 - 20)) * 0.4;
          return (
            <g key={"n" + p.id} className="machi-part-token" style={{ animationDelay: `${i * 0.35}s` }}>
              <circle cx={x} cy={y} r={29} className="machi-part-glow" style={{ fill: role.color, opacity: glowOpacity }} />
              <circle cx={x} cy={y} r={23} fill={`url(#machiNodeGradient-${p.relationType})`} className="machi-part-node" />
              <ellipse cx={x - 8} cy={y - 9} rx={7} ry={4.5} className="machi-bead-shine" />
              <text x={x} y={y + 7} textAnchor="middle" className="machi-part-node-text">{role.emoji}</text>
              <rect x={x - 32} y={y + 28} width={64} height={17} rx={8} className="machi-part-name-bg" />
              <text x={x} y={y + 40} textAnchor="middle" className="machi-part-node-name">{p.name}</text>
            </g>
          );
        })}
        {(Object.entries(ROLE_INFO) as [RelationType, typeof ROLE_INFO[RelationType]][]).map(([key, r]) => {
          const deg = BADGE_ANGLE_DEG[key];
          const rad = (deg * Math.PI) / 180;
          const bx = cx + BADGE_LABEL_RADIUS * Math.cos(rad);
          const by = cy + BADGE_LABEL_RADIUS * Math.sin(rad);
          return (
            <g key={key}>
              <rect x={bx - 44} y={by - 16} width={88} height={32} rx={16} className="machi-role-pill-bg" style={{ stroke: r.color }} />
              <text x={bx} y={by + 6} textAnchor="middle" className="machi-role-pill-text" style={{ fill: r.color }}>
                {r.emoji} {r.label}
              </text>
            </g>
          );
        })}
      </svg>

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
  const [friendCalendarBase, setFriendCalendarBase] = useState("solar");
  const [friendIsLeapMonth, setFriendIsLeapMonth] = useState(false);
  const [friendDate, setFriendDate] = useState<SajuDateValue>({ year: 0, month: 0, day: 0 });
  const [friendTime, setFriendTime] = useState<SajuTimeValue>({ hour: 0, minute: 0 });
  const [friendTimeUnknown, setFriendTimeUnknown] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState("");
  const [showFullMap, setShowFullMap] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCharDetail, setShowCharDetail] = useState(false);

  const canSubmit = !!friendName.trim() && !!friendDate.year && !!friendDate.month && !!friendDate.day;

  const handleAddFriend = () => {
    let friendChart: SajuChart;
    try {
      friendChart = computeSaju({
        gender: "female",
        calendarType: toCalendarType(friendCalendarBase, friendIsLeapMonth),
        date: friendDate,
        time: friendTimeUnknown ? { hour: 12, minute: 0 } : friendTime,
        timeUnknown: friendTimeUnknown,
      });
    } catch {
      setError("해당 날짜로 원국을 만들 수 없습니다. 날짜를 확인해 주세요.");
      return;
    }

    const owner = dayElementBranch(ownerChart);
    const friend = dayElementBranch(friendChart);
    const { type, score, hap, chung } = calcCompatibility(owner.elIdx, owner.branchIdx, friend.elIdx, friend.branchIdx);
    const archetype = deriveArchetype(friendChart);
    const elementCounts = countElements(friendChart);

    setParticipants((prev) => [
      ...prev,
      {
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: friendName.trim(),
        elIdx: friend.elIdx,
        elementCounts,
        angle: nodeAngle(type, prev.filter((p) => p.relationType === type).length),
        hap,
        chung,
        relationType: type,
        score,
        archetype,
      },
    ]);
    setError("");
    setFriendName("");
    setFriendCalendarBase("solar");
    setFriendIsLeapMonth(false);
    setFriendDate({ year: 0, month: 0, day: 0 });
    setFriendTime({ hour: 0, minute: 0 });
    setFriendTimeUnknown(true);
  };

  return (
    <div className="saju-page machi-page">
      <header className="saju-header machi-gate">
        <h1 className="machi-gate-title">귀인지도</h1>
        <p>친구들과의 궁합을 모아봐요</p>
      </header>

      <section className="saju-section">
        <SectionHeader title="이름" />
        <SajuTextInput value={friendName} onChange={setFriendName} placeholder="별주부" icon="🐚" />

        <div style={{ height: "0.9rem" }} />

        <SectionHeader title="태어난 날과 시간" />

        <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PillToggleGroup
              options={CALENDAR_BASE_OPTIONS}
              value={friendCalendarBase}
              onChange={(v) => { setFriendCalendarBase(v); if (v === "solar") setFriendIsLeapMonth(false); }}
              variant="inline"
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PillToggleGroup
              options={LEAP_OPTIONS.map((o) => ({ ...o, disabled: friendCalendarBase === "solar" }))}
              value={friendIsLeapMonth ? "leap" : "normal"}
              onChange={(v) => setFriendIsLeapMonth(v === "leap")}
              variant="inline"
            />
          </div>
        </div>

        <div style={{ height: "0.75rem" }} />

        <DateInputGroup value={friendDate} onChange={setFriendDate} />

        <TimeInputGroup
          value={friendTime}
          unknown={friendTimeUnknown}
          onChange={setFriendTime}
          onUnknownChange={(v) => {
            setFriendTimeUnknown(v);
            if (v) setFriendTime({ hour: 0, minute: 0 });
          }}
        />

        {error && <div className="saju-info-error">{error}</div>}

        <div style={{ height: "1rem" }} />
        <SubmitButton label="궁합 보기" disabled={!canSubmit} onClick={handleAddFriend} />
      </section>

      {participants.length === 0 && (
        <div className="machi-character-card">
          <div className="machi-character-hint">생년월일시를 넣고 궁합 보기를 누르면 상대방 유형이 나와요</div>
        </div>
      )}

      {participants.length > 0 && (
        <>
          {(() => {
            const latest = participants[participants.length - 1];
            const role = ROLE_INFO[latest.relationType];
            const balance = buildElementBalanceInsight(latest.elementCounts);
            const elTrait = ELEMENT_TRAIT[latest.elIdx];
            return (
              <div className="machi-character-card">
                <div className="machi-character-portrait">
                  <div className="machi-character-emoji">{latest.archetype.emoji}</div>
                </div>
                <div className="machi-character-name-row">
                  <div className="machi-character-name">
                    {latest.name} · {latest.archetype.name} · {ELEMENT_KR_SHORT[latest.elIdx]}형
                  </div>
                  <button
                    type="button"
                    className="machi-detail-toggle-btn"
                    onClick={() => setShowCharDetail((v) => !v)}
                    aria-label={showCharDetail ? "접기" : "자세히"}
                  >
                    {showCharDetail ? "△" : "▽"}
                  </button>
                </div>

                {showCharDetail && (
                  <>
                    <p className="machi-character-desc">{latest.archetype.desc}</p>

                    <div className="machi-character-highlight" style={{ borderColor: ELEMENT_COLOR[latest.elIdx], color: ELEMENT_COLOR[latest.elIdx] }}>
                      {ELEMENT_EMOJI[latest.elIdx]} {elTrait.trait} — {elTrait.desc}
                    </div>
                    <div className="machi-character-highlight" style={{ borderColor: role.color, color: role.color }}>
                      {role.emoji} 나에게는 {role.label} — {role.desc}
                    </div>
                    <div className="machi-radar-wrap">
                      <svg viewBox="0 0 140 140" className="machi-radar">
                        <polygon points={pentagonPoints(70, 66, 46)} className="machi-radar-ring" />
                        <polygon points={pentagonPoints(70, 66, 23)} className="machi-radar-ring" />
                        {[0, 1, 2, 3, 4].map((i) => {
                          const p = radarPoint(i, 4, 70, 66, 46, 4);
                          return <line key={"axis" + i} x1={70} y1={66} x2={p.x} y2={p.y} className="machi-radar-axis" />;
                        })}
                        <polygon
                          points={[0, 1, 2, 3, 4].map((i) => {
                            const p = radarPoint(i, latest.elementCounts[i], 70, 66, 46, 4);
                            return `${p.x},${p.y}`;
                          }).join(" ")}
                          className="machi-radar-fill"
                        />
                        {[0, 1, 2, 3, 4].map((i) => {
                          const p = radarPoint(i, latest.elementCounts[i], 70, 66, 46, 4);
                          return <circle key={"pt" + i} cx={p.x} cy={p.y} r={4} fill={ELEMENT_COLOR[i]} className="machi-radar-dot" />;
                        })}
                        {[0, 1, 2, 3, 4].map((i) => {
                          const p = radarPoint(i, 4.9, 70, 66, 46, 4);
                          return (
                            <text key={"lbl" + i} x={p.x} y={p.y + 4} textAnchor="middle" className="machi-radar-label" fill={ELEMENT_COLOR[i]}>
                              {ELEMENT_KR_SHORT[i]}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                    <div className="machi-character-highlight">
                      {balance.weakEmoji} {balance.text}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          <div className="machi-map-header">
            <SectionHeader title="관계 지도" sub={`${participants.length + 1}명`} />
            <button type="button" className="machi-reset-btn" onClick={() => setParticipants([])}>
              <img src={resetIcon} alt="" aria-hidden="true" className="machi-reset-icon" />
              초기화
            </button>
          </div>
          <MapDiagram participants={participants} onClick={() => setShowFullMap(true)} />
          <p className="machi-map-hint">지도를 누르면 크게 볼 수 있어요</p>

          <div className="machi-stat-row">
            {Object.entries(ROLE_INFO).map(([key, r]) => {
              const count = participants.filter((p) => p.relationType === key).length;
              return (
                <div className="machi-stat-tile" key={key}>
                  <div className="machi-stat-token" style={{ borderColor: r.color, background: `radial-gradient(60% 60% at 35% 30%, rgba(255,255,255,0.5), ${r.color}55 70%)` }}>
                    {r.emoji}
                  </div>
                  <div className="machi-stat-num" style={{ color: r.color }}>{count}</div>
                  <div className="machi-stat-label">{r.label}</div>
                </div>
              );
            })}
          </div>

          {(() => {
            const insight = buildEnergyInsight(dayElementBranch(ownerChart).elIdx, participants);
            return (
              <div className="machi-insight-box" style={{ borderColor: insight.fillColor }}>
                <p className="machi-insight-direction">{insight.directionText}</p>
                <p className="machi-insight-fill">
                  {insight.fillEmoji} {insight.fillName} 기운 친구가 늘어오면 앞으로는 다시 채워져요.
                </p>
              </div>
            );
          })()}

          <SectionHeader title="케미 순위" sub="이름을 누르면 자세히 봐요" />
          <ol className="machi-participant-list">
            {[...participants]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => {
                const role = ROLE_INFO[p.relationType];
                return (
                  <li className="machi-participant-item" key={p.id}>
                    <span className="machi-participant-rank">{i + 1}</span>
                    <button type="button" className="machi-participant-name" onClick={() => setSelectedId(p.id)}>
                      {p.name}
                    </button>
                    <span className="machi-participant-tag" style={{ color: role.color, borderColor: role.color }}>
                      {role.emoji} {role.label}
                    </span>
                    <span className="machi-participant-score">{p.score}점</span>
                  </li>
                );
              })}
          </ol>
        </>
      )}

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

      {selectedId && (() => {
        const p = participants.find((x) => x.id === selectedId);
        if (!p) return null;
        const role = ROLE_INFO[p.relationType];
        return (
          <div className="saju-modal-overlay" onClick={() => setSelectedId(null)}>
            <div className="saju-modal machi-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="saju-modal-header">
                <h4>{p.name}와의 궁합</h4>
                <button type="button" className="saju-modal-close" onClick={() => setSelectedId(null)} aria-label="닫기">✕</button>
              </div>

              <div className="machi-detail-role" style={{ color: role.color, borderColor: role.color }}>
                {role.emoji} {role.label} · {p.score}점
              </div>
              <p className="machi-detail-desc">{role.desc}</p>

              {(p.hap || p.chung) && (
                <p className="machi-detail-note">
                  {p.hap && "지지가 합(合)이라 손발이 잘 맞는 편이에요."}
                  {p.chung && "지지가 충(沖)이라 사소한 걸로 부딪힐 수 있어요."}
                </p>
              )}

              <div className="machi-detail-archetype">
                {p.archetype.emoji} {p.archetype.name} — {p.archetype.desc}
              </div>

              <div className="machi-detail-caution">
                <strong>조심할 점</strong>
                <p>{role.caution}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

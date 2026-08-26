import { useState } from "react";
import "../styles/saju.css";
import { useSaju } from "../state/SajuContext";
import BubbleField from "../components/effects/BubbleField";
import titleLogo from "../assets/img/Group 27.png";
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
   SajuForm.tsx
   "당신의 사주를 봅니다" 온보딩 폼 (용궁 다크 테마)
   입력값은 context에 커밋 → 원국 계산·화면 전환은 context가 담당
   ============================================================ */

const GENDER_OPTIONS: PillOption[] = [
  { value: "male", label: "♂ 남자" },
  { value: "female", label: "♀ 여자" },
];
const CALENDAR_BASE_OPTIONS: PillOption[] = [
  { value: "solar", label: "양력" },
  { value: "lunar", label: "음력" },
];
const LEAP_OPTIONS: PillOption[] = [
  { value: "normal", label: "평달" },
  { value: "leap", label: "윤달" },
];

export default function SajuForm() {
  const { inputs, chart, commit, navigate } = useSaju();

  // 폼 필드는 로컬 상태. 초기값은 저장된 입력(context.inputs)에서 복원.
  const [name, setName] = useState(inputs?.name ?? "");
  const [gender, setGender] = useState(inputs?.gender ?? "male");
  const [calendarBase, setCalendarBase] = useState(inputs?.calendarBase ?? "solar");
  const [isLeapMonth, setIsLeapMonth] = useState(inputs?.isLeapMonth ?? false);
  const [date, setDate] = useState<SajuDateValue>(inputs?.date ?? { year: 0, month: 0, day: 0 });
  const [time, setTime] = useState<SajuTimeValue>(inputs?.time ?? { hour: 0, minute: 0 });
  const [timeUnknown, setTimeUnknown] = useState(inputs?.timeUnknown ?? false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!date.year || !date.month || !date.day) {
      setError("생년월일을 모두 입력해 주세요.");
      return;
    }
    try {
      commit({ name, gender, calendarBase, isLeapMonth, date, time, timeUnknown });
    } catch {
      setError("해당 날짜로 원국을 만들 수 없습니다. 윤달 여부·날짜를 확인해 주세요.");
    }
  };

  return (
    <div className="saju-page">
      <BubbleField />
      <header className="saju-header">
        <img className="saju-brand" src={titleLogo} alt="용궁" style={{ height: "clamp(40px, 12cqw, 72px)", width: "auto" }} />
        <h1>용왕님이 살펴주는</h1>
        <p>너란 <span style={{ color: "#E6B45A" }}>생원</span></p>
        {/* 이미 원국이 있으면(뒤로 온 경우) 결과로 복귀 */}
        {chart && (
          <button type="button" className="saju-resume-btn" onClick={() => navigate("home")}>
            ← 방금 본 결과로
          </button>
        )}
      </header>

      {/* 이름 */}
      <section className="saju-section">
        <SectionHeader title="이름" />
        <SajuTextInput value={name} onChange={setName} placeholder="김토끼" icon="🐚" />
      </section>

      {/* 성별 */}
      <section className="saju-section">
        <SectionHeader title="성별" />
        <PillToggleGroup options={GENDER_OPTIONS} value={gender} onChange={setGender} variant="segment" />
      </section>

      {/* 생년월일시 */}
      <section className="saju-section">
        <SectionHeader title="태어난 날과 시간" />

        <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PillToggleGroup
              options={CALENDAR_BASE_OPTIONS}
              value={calendarBase}
              onChange={(v) => { setCalendarBase(v); if (v === "solar") setIsLeapMonth(false); }}
              variant="inline"
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PillToggleGroup
              options={LEAP_OPTIONS.map((o) => ({ ...o, disabled: calendarBase === "solar" }))}
              value={isLeapMonth ? "leap" : "normal"}
              onChange={(v) => setIsLeapMonth(v === "leap")}
              variant="inline"
            />
          </div>
        </div>

        <div style={{ height: "0.75rem" }} />

        <DateInputGroup value={date} onChange={setDate} />

        <TimeInputGroup
          value={time}
          unknown={timeUnknown}
          onChange={setTime}
          onUnknownChange={(v) => {
            setTimeUnknown(v);
            if (v) setTime({ hour: 0, minute: 0 });
          }}
        />

        {error && <div className="saju-info-error">{error}</div>}
      </section>

      <SubmitButton icon="🌊" loading={false} disabled={false} onClick={handleSubmit} />
    </div>
  );
}

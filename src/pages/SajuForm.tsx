import { useState } from "react";
import "../styles/saju.css";
import { computeSajuExtended, type SajuExtended } from "../saju";
import { getReading, type Story } from "../services/sajuApi";
import Dashboard from "./dashboard/Dashboard";
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
   폼 부품은 components/form/ 에서 import, 여기선 상태·조립만 담당
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
  const [name, setName] = useState("");
  const [gender, setGender] = useState("male");
  const [calendarBase, setCalendarBase] = useState("solar"); // "solar" | "lunar"
  const [isLeapMonth, setIsLeapMonth] = useState(false);     // 음력일 때만 의미
  const [date, setDate] = useState<SajuDateValue>({ year: 0, month: 0, day: 0 });
  const [time, setTime] = useState<SajuTimeValue>({ hour: 0, minute: 0 });
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<SajuExtended | null>(null);
  const [stories, setStories] = useState<Story[] | null>(null);

  const handleSubmit = async () => {
    if (!date.year || !date.month || !date.day) {
      setError("생년월일을 모두 입력해 주세요.");
      return;
    }

    let computed: SajuExtended;
    try {
      const calendarType =
        calendarBase === "solar" ? "solar" : isLeapMonth ? "leap-month" : "lunar";
      computed = computeSajuExtended({ gender, calendarType, date, time, timeUnknown });
    } catch {
      setError("해당 날짜로 원국을 만들 수 없습니다. 윤달 여부·날짜를 확인해 주세요.");
      return;
    }

    setError("");
    setStories(null);
    setChart(computed);
    fetchReading(computed);
  };

  const fetchReading = async (computed: SajuExtended) => {
    setLoading(true);
    try {
      const stories = await getReading({ name, gender, chart: computed });
      setStories(stories);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "풀이 생성 실패");
      setStories(null);
    } finally {
      setLoading(false);
    }
  };

  if (chart) {
    return (
      <Dashboard
        chart={chart}
        stories={stories}
        loading={loading}
        onRetry={() => fetchReading(chart)}
        name={name}
        gender={gender}
        date={date}
        time={time}
        timeUnknown={timeUnknown}
        onBack={() => {
          setChart(null);
          setStories(null);
        }}
      />
    );
  }

  return (
    <div className="saju-page">
      <header className="saju-header">
        <img className="saju-brand" src={titleLogo} alt="용궁" style={{ height: "clamp(40px, 12cqw, 72px)", width: "auto" }} />
        <h1>용왕님이 살펴주는</h1>
        <p>너란 <span style={{ color: "#E6B45A" }}>생원</span></p>
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

      <SubmitButton loading={loading} disabled={loading} onClick={handleSubmit} />
    </div>
  );
}

import { useState, useRef, useEffect, type ChangeEvent, type ReactNode } from "react";
import "./styles/saju.css";
import { computeSajuExtended, type SajuExtended } from "./saju";
import { getReading, type Story } from "./services/sajuApi";
import Dashboard from "./components/dashboard/Dashboard";
import titleLogo from "./assets/img/Group 27.png";

/* ============================================================
   SajuForm.tsx
   "당신의 사주를 봅니다" 온보딩 폼 (용궁 다크 테마)

     STEP 1. SectionHeader   - 제목
     STEP 2. SajuTextInput   - 이름 입력칸
     STEP 3. PillToggleGroup - 성별 / 양력·음력·평달·윤달
     STEP 4. NumberField + DateInputGroup - 년/월/일 입력+선택
     STEP 5. ToggleSwitch    - 시간모름 on/off
     STEP 6. TimeInputGroup  - 시/분 입력+선택 + 시간모름
     STEP 7. InfoBanner      - 유효성 경고
     STEP 8. SubmitButton    - "원국 생성 →"
     STEP 9. SajuForm        - 조립
   ============================================================ */

interface SajuDateValue { year: number; month: number; day: number; }
interface SajuTimeValue { hour: number; minute: number; }
interface PillOption { value: string; label: string; disabled?: boolean; }

/* ------------------------------------------------------------
   STEP 1. SectionHeader
   ------------------------------------------------------------ */
interface SectionHeaderProps { title: string; sub?: string; }
function SectionHeader({ title, sub }: SectionHeaderProps) {
  return (
    <div className="saju-section-title-row">
      <h3>{title}</h3>
      {sub && <span className="saju-title-sub">{sub}</span>}
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 2. SajuTextInput (이름 입력칸)
   ------------------------------------------------------------ */
interface SajuTextInputProps {
  id?: string; value: string; placeholder?: string; icon?: ReactNode;
  onChange: (value: string) => void;
}
function SajuTextInput({ id, value, placeholder, icon, onChange }: SajuTextInputProps) {
  const [isFocus, setIsFocus] = useState(false);
  return (
    <div className="saju-text-input-wrap">
      {icon && <span className="saju-text-input-icon">{icon}</span>}
      <input
        id={id}
        className={`saju-text-input${isFocus ? " is-focus" : ""}`}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
      />
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 3. PillToggleGroup (성별 / 양력·음력)
   ------------------------------------------------------------ */
interface PillToggleGroupProps {
  options: PillOption[]; value: string;
  onChange: (value: string) => void; variant?: "segment" | "inline";
}
function PillToggleGroup({ options, value, onChange, variant = "inline" }: PillToggleGroupProps) {
  if (variant === "segment") {
    const selectedIndex = options.findIndex((o) => o.value === value);
    const sideClass = selectedIndex === 0 ? "is-left" : selectedIndex === 1 ? "is-right" : "";
    return (
      <div className={`saju-pill-group saju-pill-group--framed ${sideClass}`} role="tablist">
        {options.map((opt) => (
          <button
            key={opt.value} type="button" role="tab"
            aria-selected={opt.value === value}
            className={`saju-pill${opt.value === value ? " is-active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="saju-pill-group saju-pill-group--inline" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value} type="button" role="tab"
          aria-selected={opt.value === value}
          disabled={opt.disabled}
          className={["saju-pill", opt.value === value ? "is-active" : "", opt.disabled ? "is-disabled" : ""].filter(Boolean).join(" ")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 5(공용). NumberField (숫자 입력 + 아래로 펼치는 선택)
   년/월/일 · 시/분 에서 공통 사용
   ------------------------------------------------------------ */
interface NumberFieldProps {
  value: number; options: number[]; placeholder: string; unit: string;
  maxLen: number; min: number; max: number; ariaLabel: string;
  disabled?: boolean; onChange: (v: number) => void;
}
function NumberField({
  value, options, placeholder, unit, maxLen, min, max, ariaLabel, disabled, onChange,
}: NumberFieldProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const shown = value === 0 ? "" : String(value);
  const filtered = shown === "" ? options : options.filter((o) => String(o).startsWith(shown));

  const commit = (v: number) => {
    // 비어있으면(0) 그대로 비워둠 — min 으로 보정하지 않음
    if (v === 0) {
      onChange(0);
      return;
    }
    let nv = v;
    if (nv < min) nv = min;
    if (nv > max) nv = max;
    onChange(nv);
  };

  return (
    <div className="saju-input-box" ref={boxRef}>
      <input
        type="text" inputMode="numeric" className="saju-date-input"
        value={shown} placeholder={placeholder} aria-label={ariaLabel} disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, maxLen);
          onChange(digits === "" ? 0 : Number(digits));
          setOpen(digits.length < maxLen);
        }}
        onFocus={() => { if (!disabled) setOpen(true); }}
        onBlur={() => { commit(value); setOpen(false); }}
      />
      <span className="saju-select-unit">{unit}</span>
      <button
        type="button" className="saju-date-caret" aria-label={`${ariaLabel} 목록 열기`}
        onClick={() => { if (!disabled) setOpen((o) => !o); }} tabIndex={-1} disabled={disabled}
      >
        ▾
      </button>
      {open && !disabled && filtered.length > 0 && (
        <ul className="saju-date-dropdown" role="listbox">
          {filtered.map((o) => (
            <li
              key={o} role="option" aria-selected={o === value}
              className={`saju-date-option${o === value ? " is-selected" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); commit(o); setOpen(false); }}
            >
              {o}{unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 4. DateInputGroup (년/월/일)
   ------------------------------------------------------------ */
interface DateInputGroupProps {
  value: SajuDateValue; onChange: (value: SajuDateValue) => void;
  yearRange?: [number, number];
}
function DateInputGroup({ value, onChange, yearRange = [1930, 2026] }: DateInputGroupProps) {
  const years: number[] = [];
  for (let y = yearRange[1]; y >= yearRange[0]; y--) years.push(y);
  const months: number[] = []; for (let m = 1; m <= 12; m++) months.push(m);
  const days: number[] = []; for (let d = 1; d <= 31; d++) days.push(d);
  return (
    <div className="saju-select-row">
      <NumberField value={value.year} options={years} placeholder="2003" unit="년" maxLen={4} min={1900} max={2100} ariaLabel="출생 연도" onChange={(v) => onChange({ ...value, year: v })} />
      <NumberField value={value.month} options={months} placeholder="2" unit="월" maxLen={2} min={1} max={12} ariaLabel="출생 월" onChange={(v) => onChange({ ...value, month: v })} />
      <NumberField value={value.day} options={days} placeholder="16" unit="일" maxLen={2} min={1} max={31} ariaLabel="출생 일" onChange={(v) => onChange({ ...value, day: v })} />
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 5. ToggleSwitch (시간모름)
   ------------------------------------------------------------ */
interface ToggleSwitchProps { checked: boolean; onChange: (checked: boolean) => void; label?: string; }
function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <div className="saju-toggle-wrap">
      <button
        type="button" role="switch" aria-checked={checked}
        className={`saju-toggle${checked ? " is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="saju-toggle-knob" />
      </button>
      {label && <span className="saju-toggle-label">{label}</span>}
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 6. TimeInputGroup (시/분 직접 입력+선택 + 시간모름)
   ------------------------------------------------------------ */
interface TimeInputGroupProps {
  value: SajuTimeValue; unknown: boolean;
  onChange: (value: SajuTimeValue) => void;
  onUnknownChange: (unknown: boolean) => void;
}
function TimeInputGroup({ value, unknown, onChange, onUnknownChange }: TimeInputGroupProps) {
  const hours: number[] = []; for (let h = 0; h <= 23; h++) hours.push(h);
  const minutes: number[] = []; for (let m = 0; m <= 59; m++) minutes.push(m);
  return (
    <div className="saju-time-row">
      <div className={`saju-time-fields${unknown ? " is-unknown" : ""}`}>
        <NumberField value={value.hour} options={hours} placeholder="시" unit="시" maxLen={2} min={0} max={23} ariaLabel="출생 시" disabled={unknown} onChange={(v) => onChange({ ...value, hour: v })} />
        <NumberField value={value.minute} options={minutes} placeholder="분" unit="분" maxLen={2} min={0} max={59} ariaLabel="출생 분" disabled={unknown} onChange={(v) => onChange({ ...value, minute: v })} />
        {unknown && <div className="saju-time-unknown-box">생시없이 봐드려요</div>}
      </div>
      <ToggleSwitch checked={unknown} onChange={onUnknownChange} label="시간 모름" />
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 8. SubmitButton
   ------------------------------------------------------------ */
interface SubmitButtonProps { label?: string; disabled?: boolean; loading?: boolean; onClick?: () => void; }
function SubmitButton({ label = "원국 생성  →", disabled, loading, onClick }: SubmitButtonProps) {
  return (
    <button type="submit" className="saju-submit-button" disabled={disabled || loading} onClick={onClick}>
      {loading ? "생성 중..." : (<><span>🐚</span>{label}</>)}
    </button>
  );
}

/* ------------------------------------------------------------
   STEP 9. SajuForm (조립)
   ------------------------------------------------------------ */
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

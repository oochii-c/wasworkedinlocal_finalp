import { useState, type ChangeEvent, type ReactNode } from "react";
import "./styles/saju.css";

/* ============================================================
   SajuForm.tsx
   ----------------------------------------------------------
   "당신의 사주를 봅니다" 온보딩 폼 (용궁 다크 테마)

     STEP 0.  타입 정의 + 12간지 데이터
     STEP 1.  SectionHeader   - 제목 (+ 부제)  ※ 번호배지 제거됨
     STEP 2.  SajuTextInput   - 이름 입력칸 (01/02/03.svg + 조개 아이콘)
     STEP 3.  PillToggleGroup - 성별 2단(segment) / 양력·음력·평달·윤달 4단(inline)
     STEP 4.  DateSelectGroup - 년/월/일 드롭다운
     STEP 5.  ToggleSwitch    - 시간모름 on/off 스위치
     STEP 6.  ZodiacTimePicker- 시간 선택 버튼(누르면 12간지 표 모달) + 시간모름
     STEP 7.  InfoBanner      - 안내 문구 + 유효성 경고
     STEP 8.  ZodiacTimeModal - 12간지 시간표 (표에서 항목을 클릭해 선택)
     STEP 9.  SubmitButton    - "원국 생성 →" 버튼
     STEP 10. SajuForm(default export) - 조립 메인 컴포넌트
   ============================================================ */

/* ------------------------------------------------------------
   STEP 0. 타입 정의 + 12간지 데이터
   ------------------------------------------------------------ */
interface SajuDateValue {
  year: number;
  month: number;
  day: number;
}

interface PillOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/* 12간지: [간지명, 시간대] — 인덱스(0~11)로 선택값을 관리 */
const ZODIAC_TABLE: Array<[string, string]> = [
  ["자시", "23:30(전날)~01:30"],
  ["축시", "01:30~03:30"],
  ["인시", "03:30~05:30"],
  ["묘시", "05:30~07:30"],
  ["진시", "07:30~09:30"],
  ["사시", "09:30~11:30"],
  ["오시", "11:30~13:30"],
  ["미시", "13:30~15:30"],
  ["신시", "15:30~17:30"],
  ["유시", "17:30~19:30"],
  ["술시", "19:30~21:30"],
  ["해시", "21:30~23:30"],
];

function range(start: number, end: number): number[] {
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

/* ------------------------------------------------------------
   STEP 1. SectionHeader (번호배지 없음)
   ------------------------------------------------------------ */
interface SectionHeaderProps {
  title: string;
  sub?: string;
}

function SectionHeader({ title, sub }: SectionHeaderProps) {
  return (
    <div className="saju-section-title-row">
      <h3>{title}</h3>
      {sub && <span className="saju-title-sub">{sub}</span>}
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 2. SajuTextInput (01/02/03.svg + 왼쪽 조개 아이콘)
   ------------------------------------------------------------ */
interface SajuTextInputProps {
  id?: string;
  value: string;
  placeholder?: string;
  icon?: ReactNode;
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
   STEP 3. PillToggleGroup
   variant="segment" : 성별처럼 2개 (10/11/12.svg 배경)
   variant="inline"  : 양력/음력/평달/윤달처럼 여러 개 (테두리 박스)
   ------------------------------------------------------------ */
interface PillToggleGroupProps {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: "segment" | "inline";
}

function PillToggleGroup({ options, value, onChange, variant = "inline" }: PillToggleGroupProps) {
  if (variant === "segment") {
    const selectedIndex = options.findIndex((o) => o.value === value);
    const sideClass = selectedIndex === 0 ? "is-left" : selectedIndex === 1 ? "is-right" : "";
    return (
      <div className={`saju-pill-group saju-pill-group--framed ${sideClass}`} role="tablist">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
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
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          disabled={opt.disabled}
          className={[
            "saju-pill",
            opt.value === value ? "is-active" : "",
            opt.disabled ? "is-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 4. DateSelectGroup (년/월/일)
   ------------------------------------------------------------ */
interface DateSelectGroupProps {
  value: SajuDateValue;
  onChange: (value: SajuDateValue) => void;
  yearRange?: [number, number];
}

function DateSelectGroup({ value, onChange, yearRange = [1930, 2026] }: DateSelectGroupProps) {
  const years = range(yearRange[0], yearRange[1]);
  const months = range(1, 12);
  const days = range(1, 31);

  const handle = (key: keyof SajuDateValue) => (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, [key]: Number(e.target.value) });
  };

  return (
    <div className="saju-select-row">
      <div className="saju-select-box">
        <select value={value.year} onChange={handle("year")} aria-label="출생 연도">
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="saju-select-unit">년</span>
      </div>

      <div className="saju-select-box">
        <select value={value.month} onChange={handle("month")} aria-label="출생 월">
          {months.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
          ))}
        </select>
        <span className="saju-select-unit">월</span>
      </div>

      <div className="saju-select-box">
        <select value={value.day} onChange={handle("day")} aria-label="출생 일">
          {days.map((d) => (
            <option key={d} value={d}>{String(d).padStart(2, "0")}</option>
          ))}
        </select>
        <span className="saju-select-unit">일</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 5. ToggleSwitch
   ------------------------------------------------------------ */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <div className="saju-toggle-wrap">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
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
   STEP 6. ZodiacTimePicker (시간 선택 버튼 + 시간모름 토글)
   - 버튼을 누르면 12간지 표 모달이 열림 (onOpenPicker)
   - timeIndex 가 null 이면 "시간 선택", 아니면 "자시 (23:30~01:30)" 표시
   - 시간모름이 켜지면 시간 선택 버튼은 비활성
   ------------------------------------------------------------ */
interface ZodiacTimePickerProps {
  timeIndex: number | null;
  unknown: boolean;
  onOpenPicker: () => void;
  onUnknownChange: (unknown: boolean) => void;
}

function ZodiacTimePicker({ timeIndex, unknown, onOpenPicker, onUnknownChange }: ZodiacTimePickerProps) {
  const label =
    timeIndex === null
      ? "시간 선택"
      : `${ZODIAC_TABLE[timeIndex][0]} (${ZODIAC_TABLE[timeIndex][1]})`;

  return (
    <div className="saju-time-row">
      <button
        type="button"
        className={`saju-time-trigger${timeIndex === null ? " is-placeholder" : ""}`}
        onClick={onOpenPicker}
        disabled={unknown}
      >
        <span>🕐 {label}</span>
        <span className="saju-time-caret">▾</span>
      </button>

      <ToggleSwitch checked={unknown} onChange={onUnknownChange} label="시간모름" />
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 7. InfoBanner
   ------------------------------------------------------------ */
function InfoBanner() {
  return (
    <>
      <div className="saju-info-note">
        시간 모름 켜면 시각 값 비활성 · "사주 없이 계산됨"
      </div>
      <div className="saju-info-warning">
        <span>⚠️</span>
        <span>잘못 입력 시 인풋 하단 빨간 글씨 — 예: '입력 정보를 다시 확인해 주세요.'</span>
      </div>
    </>
  );
}

/* ------------------------------------------------------------
   STEP 8. ZodiacTimeModal (12간지 시간표 — 표에서 클릭해 선택)
   - 행을 클릭하면 onSelect(index) 호출 후 모달 닫힘
   - 현재 선택된 행은 하이라이트
   ------------------------------------------------------------ */
interface ZodiacTimeModalProps {
  open: boolean;
  selectedIndex: number | null;
  onClose: () => void;
  onSelect: (index: number) => void;
}

function ZodiacTimeModal({ open, selectedIndex, onClose, onSelect }: ZodiacTimeModalProps) {
  if (!open) return null;

  return (
    <div className="saju-modal-overlay" onClick={onClose}>
      <div className="saju-modal" onClick={(e) => e.stopPropagation()}>
        <div className="saju-modal-header">
          <h4>12간지 시간표</h4>
          <button type="button" className="saju-modal-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <table className="saju-modal-table">
          <thead>
            <tr>
              <th>간지</th>
              <th>시간</th>
            </tr>
          </thead>
          <tbody>
            {ZODIAC_TABLE.map(([name, time], idx) => (
              <tr
                key={name}
                className={`saju-modal-row${idx === selectedIndex ? " is-selected" : ""}`}
                onClick={() => onSelect(idx)}
              >
                <td>{name}</td>
                <td>{time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   STEP 9. SubmitButton
   ------------------------------------------------------------ */
interface SubmitButtonProps {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

function SubmitButton({ label = "원국 생성  →", disabled, loading, onClick }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className="saju-submit-button"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? "생성 중..." : (<><span>🐚</span>{label}</>)}
    </button>
  );
}

/* ------------------------------------------------------------
   STEP 10. SajuForm - 메인 컴포넌트 (조립)
   ------------------------------------------------------------ */
const GENDER_OPTIONS: PillOption[] = [
  { value: "male", label: "♂ 남자" },
  { value: "female", label: "♀ 여자" },
];

const CALENDAR_OPTIONS: PillOption[] = [
  { value: "solar", label: "양력" },
  { value: "lunar", label: "음력" },
  { value: "normal-month", label: "평달" },
  { value: "leap-month", label: "윤달" },
];

export default function SajuForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("male");
  const [calendarType, setCalendarType] = useState("solar");
  const [date, setDate] = useState<SajuDateValue>({ year: 1990, month: 2, day: 3 });
  const [timeIndex, setTimeIndex] = useState<number | null>(null); // 12간지 인덱스(0~11)
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [isZodiacModalOpen, setZodiacModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    // TODO: 실제 API 연결
    const zodiacTime = timeIndex === null ? null : ZODIAC_TABLE[timeIndex][0];
    console.log({ name, gender, calendarType, date, zodiacTime, timeUnknown });
    setTimeout(() => setIsSubmitting(false), 800);
  };

  return (
    <div className="saju-page">
      <header className="saju-header">
        <h1>당신의 사주를 봅니다</h1>
        <p>생년월일시로 원국을 그립니다</p>
      </header>

      {/* 이름 */}
      <section className="saju-section">
        <SectionHeader title="이름" />
        <SajuTextInput value={name} onChange={setName} placeholder="홍길동" icon="🐚" />
      </section>

      {/* 성별 */}
      <section className="saju-section">
        <SectionHeader title="성별" />
        <PillToggleGroup
          options={GENDER_OPTIONS}
          value={gender}
          onChange={setGender}
          variant="segment"
        />
      </section>

      {/* 생년월일시 */}
      <section className="saju-section">
        <SectionHeader title="생년월일시" />

        <PillToggleGroup
          options={CALENDAR_OPTIONS}
          value={calendarType}
          onChange={setCalendarType}
          variant="inline"
        />

        <div className="saju-hint">
          🌙 양/음 = 음력+윤달일 때만 활성(그 외 숨김/비활성) · 기본값 없음
        </div>

        <DateSelectGroup value={date} onChange={setDate} />

        <ZodiacTimePicker
          timeIndex={timeIndex}
          unknown={timeUnknown}
          onOpenPicker={() => setZodiacModalOpen(true)}
          onUnknownChange={(v) => {
            setTimeUnknown(v);
            if (v) setTimeIndex(null); // 시간모름 켜면 선택값 초기화
          }}
        />

        <InfoBanner />
      </section>

      <SubmitButton loading={isSubmitting} onClick={handleSubmit} />

      <ZodiacTimeModal
        open={isZodiacModalOpen}
        selectedIndex={timeIndex}
        onClose={() => setZodiacModalOpen(false)}
        onSelect={(idx) => {
          setTimeIndex(idx);
          setZodiacModalOpen(false);
        }}
      />
    </div>
  );
}

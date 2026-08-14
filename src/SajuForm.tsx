import { useState, useRef, useEffect, type ChangeEvent, type ReactNode } from "react";
import "./styles/saju.css";

/* ============================================================
   SajuForm.tsx
   ----------------------------------------------------------
   "당신의 사주를 봅니다" 온보딩 폼 (용궁 다크 테마)

     STEP 0.  타입 정의 + 12간지 데이터
     STEP 1.  SectionHeader   - 제목 (+ 부제)  ※ 번호배지 제거됨
     STEP 2.  SajuTextInput   - 이름 입력칸 (01/02/03.svg + 조개 아이콘)
     STEP 3.  PillToggleGroup - 성별 2단(segment) / 양력·음력·평달·윤달 4단(inline)
     STEP 4.  DateInputGroup  - 년/월/일 직접 입력
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
   STEP 4. DateField + DateInputGroup (년/월/일 — 입력 + 아래로 펼치는 선택)
   - DateField : 입력칸 하나 + 아래로 펼쳐지는 커스텀 드롭다운
       · 직접 타이핑 가능(숫자만), 타이핑하면 목록이 자동 필터링
       · 오른쪽 ▾ 버튼(또는 포커스) 누르면 목록이 "아래로" 펼쳐짐
       · 목록 항목 클릭 또는 blur 시 유효 범위로 보정
   - DateInputGroup : 년/월/일 3개를 한 줄에 배치
   ------------------------------------------------------------ */
interface DateFieldProps {
  value: number;                 // 0 이면 미입력
  options: number[];             // 드롭다운 목록
  placeholder: string;           // YYYY / MM / DD
  unit: string;                  // 년 / 월 / 일
  maxLen: number;                // 입력 자릿수 제한
  min: number;
  max: number;
  ariaLabel: string;
  onChange: (v: number) => void;
}

function DateField({
  value, options, placeholder, unit, maxLen, min, max, ariaLabel, onChange,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const text = value === 0 ? "" : String(value);

  // 타이핑 값에 맞춰 목록 필터링 (예: "19" → 19로 시작하는 연도)
  const filtered = text === ""
    ? options
    : options.filter((o) => String(o).startsWith(text));

  const commit = (v: number) => {
    let nv = v;
    if (nv !== 0) {
      if (nv < min) nv = min;
      if (nv > max) nv = max;
    }
    onChange(nv);
  };

  return (
    <div className="saju-input-box" ref={boxRef}>
      <input
        type="text"
        inputMode="numeric"
        className="saju-date-input"
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, maxLen);
          onChange(digits === "" ? 0 : Number(digits));
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => commit(value)}
      />
      <span className="saju-select-unit">{unit}</span>
      <button
        type="button"
        className="saju-date-caret"
        aria-label={`${ariaLabel} 목록 열기`}
        onClick={() => setOpen((o) => !o)}
        tabIndex={-1}
      >
        ▾
      </button>

      {open && filtered.length > 0 && (
        <ul className="saju-date-dropdown" role="listbox">
          {filtered.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              className={`saju-date-option${o === value ? " is-selected" : ""}`}
              // onMouseDown: input blur 보다 먼저 실행되도록
              onMouseDown={(e) => {
                e.preventDefault();
                commit(o);
                setOpen(false);
              }}
            >
              {o}{unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface DateInputGroupProps {
  value: SajuDateValue;
  onChange: (value: SajuDateValue) => void;
  yearRange?: [number, number];
}

function DateInputGroup({ value, onChange, yearRange = [1930, 2026] }: DateInputGroupProps) {
  const years: number[] = [];
  for (let y = yearRange[1]; y >= yearRange[0]; y--) years.push(y); // 최근 연도부터
  const months: number[] = [];
  for (let m = 1; m <= 12; m++) months.push(m);
  const days: number[] = [];
  for (let d = 1; d <= 31; d++) days.push(d);

  return (
    <div className="saju-select-row">
      <DateField
        value={value.year}
        options={years}
        placeholder="YYYY"
        unit="년"
        maxLen={4}
        min={1900}
        max={2100}
        ariaLabel="출생 연도"
        onChange={(v) => onChange({ ...value, year: v })}
      />
      <DateField
        value={value.month}
        options={months}
        placeholder="MM"
        unit="월"
        maxLen={2}
        min={1}
        max={12}
        ariaLabel="출생 월"
        onChange={(v) => onChange({ ...value, month: v })}
      />
      <DateField
        value={value.day}
        options={days}
        placeholder="DD"
        unit="일"
        maxLen={2}
        min={1}
        max={31}
        ariaLabel="출생 일"
        onChange={(v) => onChange({ ...value, day: v })}
      />
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
        <div className="saju-brand">용궁</div>
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

        <DateInputGroup value={date} onChange={setDate} />

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

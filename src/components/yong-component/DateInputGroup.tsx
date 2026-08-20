import { useState, useRef, useEffect, type ChangeEvent } from "react";

/* ============================================================
   DateInputGroup.tsx  (자기완결형 / self-contained)
   ----------------------------------------------------------
   ★ 이 파일 하나만 복사하면 바로 사용 가능 (별도 CSS import 불필요)
     - 스타일 내장(자동 주입), svg 없이 순수 CSS로 그림.
     - 년/월/일 각 칸: 직접 타이핑 + 아래로 펼쳐지는 목록 선택 둘 다 지원.

   [사용법]
     import { DateInputGroup, type SajuDateValue } from "./DateInputGroup";

     const [date, setDate] = useState<SajuDateValue>({ year: 0, month: 0, day: 0 });
     <DateInputGroup value={date} onChange={setDate} />
     // 필요하면 연도 범위 지정: <DateInputGroup value={date} onChange={setDate} yearRange={[1930, 2026]} />
   ============================================================ */

export interface SajuDateValue {
  year: number;   // 0 = 미입력
  month: number;
  day: number;
}

/* ---- 스타일 1회 주입 ---- */
const STYLE_ID = "date-input-group-style";
const CSS = `
.dig-row { display: flex; gap: 8px; position: relative; box-sizing: border-box; }
.dig-row * { box-sizing: border-box; }

.dig-box { flex: 1; position: relative; aspect-ratio: 200 / 76; min-width: 0; }

.dig-input {
  position: absolute; inset: 0; width: 100%; height: 100%;
  background: #09233D;
  border: 1px solid #A97935;
  border-radius: 14px;
  outline: none;
  color: #fff; -webkit-text-fill-color: #fff; color-scheme: dark;
  font-size: clamp(13px, 3.6vw, 18px);
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,.55);
  padding: 0 clamp(36px,12vw,52px) 0 clamp(8px,2.4vw,13px);
  text-align: left;
}
.dig-input::placeholder { color: #7C97B0; -webkit-text-fill-color: #7C97B0; font-weight: 500; }

.dig-unit {
  position: absolute; right: clamp(24px,7.5vw,34px); top: 50%; transform: translateY(-50%);
  font-size: clamp(10px,2.7vw,12px); color: #C6D8E8; pointer-events: none; z-index: 2;
}
.dig-caret {
  position: absolute; right: clamp(4px,1.4vw,8px); top: 50%; transform: translateY(-50%);
  width: clamp(16px,5vw,22px); height: clamp(18px,5.4vw,24px);
  display: flex; align-items: center; justify-content: center;
  background: #0A2038; border: none; border-radius: 5px;
  color: #EACB8A; font-size: clamp(9px,2.6vw,12px); cursor: pointer; z-index: 3; padding: 0;
}
.dig-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30;
  margin: 0; padding: 4px; list-style: none;
  max-height: clamp(140px, 40vh, 240px); overflow-y: auto;
  background: #0F243F; border: 1px solid #EACB8A; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
}
.dig-option {
  padding: clamp(7px,2vw,10px) clamp(8px,2.5vw,12px);
  border-radius: 9px; color: #EAF2FB; font-size: clamp(13px,3.6vw,16px);
  cursor: pointer; text-align: left;
}
.dig-option:hover { background: rgba(102,178,214,.18); }
.dig-option.is-selected {
  background: linear-gradient(180deg, #134264, #1E6E93); color: #fff; font-weight: 600;
}
`;

function useInjectStyle() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/* ---- 한 칸 (년 or 월 or 일) ---- */
interface DateFieldProps {
  value: number;
  options: number[];
  placeholder: string;
  unit: string;
  maxLen: number;
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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const text = value === 0 ? "" : String(value);
  const filtered = text === "" ? options : options.filter((o) => String(o).startsWith(text));

  const commit = (v: number) => {
    let nv = v;
    if (nv !== 0) {
      if (nv < min) nv = min;
      if (nv > max) nv = max;
    }
    onChange(nv);
  };

  return (
    <div className="dig-box" ref={boxRef}>
      <input
        type="text"
        inputMode="numeric"
        className="dig-input"
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
      <span className="dig-unit">{unit}</span>
      <button
        type="button"
        className="dig-caret"
        aria-label={`${ariaLabel} 목록 열기`}
        onClick={() => setOpen((o) => !o)}
        tabIndex={-1}
      >
        ▾
      </button>

      {open && filtered.length > 0 && (
        <ul className="dig-dropdown" role="listbox">
          {filtered.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              className={`dig-option${o === value ? " is-selected" : ""}`}
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

/* ---- 년/월/일 3칸 묶음 ---- */
interface DateInputGroupProps {
  value: SajuDateValue;
  onChange: (value: SajuDateValue) => void;
  yearRange?: [number, number];
}

export function DateInputGroup({ value, onChange, yearRange = [1930, 2026] }: DateInputGroupProps) {
  useInjectStyle();

  const years: number[] = [];
  for (let y = yearRange[1]; y >= yearRange[0]; y--) years.push(y);
  const months: number[] = [];
  for (let m = 1; m <= 12; m++) months.push(m);
  const days: number[] = [];
  for (let d = 1; d <= 31; d++) days.push(d);

  return (
    <div className="dig-row">
      <DateField
        value={value.year} options={years}
        placeholder="YYYY" unit="년" maxLen={4} min={1900} max={2100}
        ariaLabel="출생 연도" onChange={(v) => onChange({ ...value, year: v })}
      />
      <DateField
        value={value.month} options={months}
        placeholder="MM" unit="월" maxLen={2} min={1} max={12}
        ariaLabel="출생 월" onChange={(v) => onChange({ ...value, month: v })}
      />
      <DateField
        value={value.day} options={days}
        placeholder="DD" unit="일" maxLen={2} min={1} max={31}
        ariaLabel="출생 일" onChange={(v) => onChange({ ...value, day: v })}
      />
    </div>
  );
}

import { useState, useRef, useEffect, type ChangeEvent } from "react";

/* NumberField - 숫자 입력 + 아래로 펼치는 선택 (년/월/일 · 시/분 공통) */
interface NumberFieldProps {
  value: number; options: number[]; placeholder: string; unit: string;
  maxLen: number; min: number; max: number; ariaLabel: string;
  disabled?: boolean; onChange: (v: number) => void;
}

export function NumberField({
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

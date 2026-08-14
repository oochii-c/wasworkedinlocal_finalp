import { useEffect, useRef, useState } from "react";
import type { SelectOption } from "./types";

/* ------------------------------------------------------------
   SelectField : 04 closed / 05 open + 09 group / 06 07 08 item
   ------------------------------------------------------------ */
interface SelectFieldProps {
  options: SelectOption[];
  value: string | null;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function SelectField({ options, value, placeholder = "선택하세요", onChange }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <div className={`select-wrapper${isOpen ? " is-open" : ""}`} ref={wrapperRef}>
      <button
        type="button"
        className={`select${isOpen ? " is-open" : ""}`}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedLabel}
      </button>

      <ul className="option-list-group" role="listbox">
        {options.map((opt) => (
          <li
            key={opt.value}
            role="option"
            aria-selected={opt.value === value}
            className={[
              "option-list-item",
              opt.value === value ? "is-selected" : "",
              opt.disabled ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              if (opt.disabled) return;
              onChange(opt.value);
              setIsOpen(false);
            }}
          >
            {opt.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

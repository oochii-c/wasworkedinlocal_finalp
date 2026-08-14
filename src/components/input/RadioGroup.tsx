import { useId } from "react";
import type { RadioOption } from "./types";

/* ------------------------------------------------------------
   RadioGroup : 14 default / 15 selected  (여러 개 나열 가능)
   ------------------------------------------------------------ */
interface RadioGroupProps {
  name?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  const autoName = useId();
  const groupName = name ?? autoName;

  return (
    <div data-radio-group>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <div
            key={opt.value}
            className={`radio-option${selected ? " is-selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            <input
              type="radio"
              className="visually-hidden"
              name={groupName}
              checked={selected}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}

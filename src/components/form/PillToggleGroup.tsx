import { type PillOption } from "./types";

/* PillToggleGroup - 성별 / 양력·음력 등 선택 (segment | inline) */
interface PillToggleGroupProps {
  options: PillOption[]; value: string;
  onChange: (value: string) => void; variant?: "segment" | "inline";
}

export function PillToggleGroup({ options, value, onChange, variant = "inline" }: PillToggleGroupProps) {
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

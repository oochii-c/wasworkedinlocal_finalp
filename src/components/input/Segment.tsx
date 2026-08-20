/* ------------------------------------------------------------
   Segment : 10 default / 11 selected-left / 12 selected-right
   (2개 옵션 전용 토글)
   ------------------------------------------------------------ */
interface SegmentProps {
  options: [string, string];
  value: 0 | 1;
  onChange: (index: 0 | 1) => void;
}

export function Segment({ options, value, onChange }: SegmentProps) {
  const stateClass = value === 0 ? "is-selected-left" : "is-selected-right";

  return (
    <div className={`segment ${stateClass}`} role="tablist">
      {options.map((label, idx) => (
        <div
          key={label}
          role="tab"
          aria-selected={value === idx}
          className="segment-option"
          onClick={() => onChange(idx as 0 | 1)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

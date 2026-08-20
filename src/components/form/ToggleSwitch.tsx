/* ToggleSwitch - on/off 스위치 (시간모름 등) */
interface ToggleSwitchProps { checked: boolean; onChange: (checked: boolean) => void; label?: string; }

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
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

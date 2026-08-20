import { NumberField } from "./NumberField";
import { ToggleSwitch } from "./ToggleSwitch";
import { type SajuTimeValue } from "./types";

/* TimeInputGroup - 시/분 입력 + 시간모름 토글 */
interface TimeInputGroupProps {
  value: SajuTimeValue; unknown: boolean;
  onChange: (value: SajuTimeValue) => void;
  onUnknownChange: (unknown: boolean) => void;
}

export function TimeInputGroup({ value, unknown, onChange, onUnknownChange }: TimeInputGroupProps) {
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

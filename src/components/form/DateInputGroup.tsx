import { NumberField } from "./NumberField";
import { type SajuDateValue } from "./types";

/* DateInputGroup - 년/월/일 입력 */
interface DateInputGroupProps {
  value: SajuDateValue; onChange: (value: SajuDateValue) => void;
  yearRange?: [number, number];
}

export function DateInputGroup({ value, onChange, yearRange = [1930, 2026] }: DateInputGroupProps) {
  const years: number[] = [];
  for (let y = yearRange[1]; y >= yearRange[0]; y--) years.push(y);
  const months: number[] = []; for (let m = 1; m <= 12; m++) months.push(m);
  const days: number[] = []; for (let d = 1; d <= 31; d++) days.push(d);
  return (
    <div className="saju-select-row">
      <NumberField value={value.year} options={years} placeholder="2003" unit="년" maxLen={4} min={1900} max={2100} ariaLabel="출생 연도" onChange={(v) => onChange({ ...value, year: v })} />
      <NumberField value={value.month} options={months} placeholder="2" unit="월" maxLen={2} min={1} max={12} ariaLabel="출생 월" onChange={(v) => onChange({ ...value, month: v })} />
      <NumberField value={value.day} options={days} placeholder="16" unit="일" maxLen={2} min={1} max={31} ariaLabel="출생 일" onChange={(v) => onChange({ ...value, day: v })} />
    </div>
  );
}

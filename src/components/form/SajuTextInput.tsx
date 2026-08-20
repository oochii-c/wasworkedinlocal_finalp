import { useState, type ChangeEvent, type ReactNode } from "react";

/* SajuTextInput - 이름 입력칸 */
interface SajuTextInputProps {
  id?: string; value: string; placeholder?: string; icon?: ReactNode;
  onChange: (value: string) => void;
}

export function SajuTextInput({ id, value, placeholder, icon, onChange }: SajuTextInputProps) {
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

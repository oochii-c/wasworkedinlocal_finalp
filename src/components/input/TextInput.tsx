import { useState, type ChangeEvent } from "react";

/* ------------------------------------------------------------
   TextInput : 01 default / 02 focus / 03 error
   ------------------------------------------------------------ */
interface TextInputProps {
  id?: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "password" | "tel" | "number";
  onChange: (value: string) => void;
  /** 부모(FormField)가 error 상태를 직접 판단해서 넘겨줄 수도 있음 */
  error?: boolean;
}

export function TextInput({
  id,
  value,
  placeholder,
  required,
  type = "text",
  onChange,
  error,
}: TextInputProps) {
  const [isFocus, setIsFocus] = useState(false);
  const [isTouchedError, setIsTouchedError] = useState(false);

  const showError = error ?? isTouchedError;

  const className = [
    "text-input",
    isFocus ? "is-focus" : "",
    showError ? "is-error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="form-control">
      <input
        id={id}
        className={className}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onFocus={() => setIsFocus(true)}
        onBlur={() => {
          setIsFocus(false);
          if (required) setIsTouchedError(!value.trim());
        }}
      />
    </div>
  );
}

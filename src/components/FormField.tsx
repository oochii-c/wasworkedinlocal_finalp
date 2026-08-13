import type { ReactNode } from "react";
import { FormLabel } from "./FormLabel";

/* ------------------------------------------------------------
   FormField : 라벨 + 컨트롤 + 헬프텍스트를 감싸는 공통 래퍼
   ------------------------------------------------------------ */
interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  helpText?: string;
  error?: boolean;
  children: ReactNode;
}

export function FormField({ label, htmlFor, helpText, error, children }: FormFieldProps) {
  return (
    <div className={`form-field${error ? " is-error" : ""}`}>
      {label && <FormLabel htmlFor={htmlFor}>{label}</FormLabel>}
      {children}
      {helpText && <p className="form-help">{helpText}</p>}
    </div>
  );
}

import type { ReactNode } from "react";

/* ------------------------------------------------------------
   FormLabel : 16_form_label.svg (배지 + 라벨 텍스트)
   ------------------------------------------------------------ */
interface FormLabelProps {
  htmlFor?: string;
  children: ReactNode;
}

export function FormLabel({ htmlFor, children }: FormLabelProps) {
  return (
    <label className="form-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

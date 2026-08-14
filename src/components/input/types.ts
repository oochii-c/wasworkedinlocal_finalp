/* ============================================================
   types.ts - 여러 컴포넌트가 공유하는 타입 정의
   ============================================================ */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioOption {
  value: string;
  label: string;
}

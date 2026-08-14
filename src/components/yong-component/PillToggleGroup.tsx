import { useEffect } from "react";

/* ============================================================
   PillToggleGroup.tsx  (자기완결형 / self-contained)
   ----------------------------------------------------------
   ★ 이 파일 하나만 복사하면 바로 사용 가능 (별도 CSS import 불필요)
     - 스타일이 컴포넌트 안에 내장되어, 처음 렌더될 때 자동 주입됩니다.
     - svg 배경 없이 순수 CSS로 그려서 어떤 프로젝트에서도 동일하게 보임.

   [사용법]
     import { PillToggleGroup } from "./PillToggleGroup";

     // 성별처럼 2개 (검은 배경 + 파란 하이라이트)
     <PillToggleGroup
       variant="segment"
       value={gender}
       onChange={setGender}
       options={[
         { value: "male",   label: "♂ 남자" },
         { value: "female", label: "♀ 여자" },
       ]}
     />

     // 양력/음력/평달/윤달처럼 여러 개 (한 줄 인라인)
     <PillToggleGroup
       variant="inline"
       value={calendarType}
       onChange={setCalendarType}
       options={[
         { value: "solar", label: "양력" },
         { value: "lunar", label: "음력" },
       ]}
     />
   ============================================================ */

export interface PillOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PillToggleGroupProps {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
  /** "segment" = 2개 토글(성별) / "inline" = 여러 개(양력·음력) */
  variant?: "segment" | "inline";
}

/* ---- 스타일 1회 주입 ---- */
const STYLE_ID = "pill-toggle-group-style";
const CSS = `
.ptg { position: relative; width: 100%; display: flex; box-sizing: border-box; }
.ptg * { box-sizing: border-box; }

.ptg--segment {
  aspect-ratio: 640 / 94;
  background: #0A0E14;
  border: 1px solid #1E3A5A;
  border-radius: 16px;
  overflow: hidden;
  padding: 5px;
  gap: 5px;
}
.ptg--segment .ptg__pill {
  flex: 1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #B8CEE0;
  font-size: clamp(14px, 4vw, 17px);
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  gap: 6px;
  transition: background .15s ease, color .15s ease, box-shadow .15s ease;
}
.ptg--segment .ptg__pill.is-active {
  background: linear-gradient(180deg, #134264, #1E6E93);
  color: #fff;
  box-shadow: inset 0 0 0 1px #EACB8A;
}

.ptg--inline {
  gap: 0;
  background: rgba(15,36,63,.9);
  border: 1px solid #1E3A5A;
  border-radius: 14px;
  padding: 4px;
}
.ptg--inline .ptg__pill {
  flex: 1;
  padding: clamp(8px,2.4vw,12px) clamp(3px,1vw,6px);
  background: transparent;
  border: none;
  border-radius: 10px;
  color: #B8CEE0;
  font-size: clamp(13px, 3.6vw, 16px);
  font-weight: 600;
  cursor: pointer;
}
.ptg--inline .ptg__pill.is-active {
  background: linear-gradient(180deg, #134264, #1E6E93);
  color: #fff;
  box-shadow: inset 0 0 0 1px #EACB8A;
}
.ptg--inline .ptg__pill.is-disabled { opacity: .35; cursor: not-allowed; }
`;

function useInjectStyle() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

export function PillToggleGroup({
  options,
  value,
  onChange,
  variant = "inline",
}: PillToggleGroupProps) {
  useInjectStyle();

  return (
    <div className={`ptg ptg--${variant}`} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          disabled={opt.disabled}
          className={[
            "ptg__pill",
            opt.value === value ? "is-active" : "",
            opt.disabled ? "is-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

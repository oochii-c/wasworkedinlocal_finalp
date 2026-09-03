import { useState, type ReactNode } from "react";
import styles from "./IconAccordion.module.css";

export interface IconAccordionItem {
  key: string;
  label: string;
  icon: string; // SVG url — CSS mask 로 그린다
  score: number; // 색 결정용 (colorFor 에 넘김)
  caption?: string; // 펼침 박스 헤더(딱지)
  figIcon?: boolean; // Figma 내보내기 → potrace 대비 축소 보정
}

export interface IconAccordionProps {
  items: IconAccordionItem[];
  colorFor: (score: number) => string;
  renderPanel: (key: string) => ReactNode;
  onOpen?: (key: string) => void;
  ariaLabel?: string;
}

/* 수평 아이콘 행 + 한 번에 하나만 펼치는 아코디언 박스.
   아이콘은 SVG 를 mask 로 깔고 background-color 로 채워 단색 실루엣으로 그린다.
   기본은 중립색, 펼친 항목만 colorFor(score) 색. */
export function IconAccordion({ items, colorFor, renderPanel, onOpen, ariaLabel }: IconAccordionProps) {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpen((cur) => {
      const next = cur === key ? null : key;
      if (next && onOpen) onOpen(next);
      return next;
    });
  };

  const active = items.find((it) => it.key === open) ?? null;

  return (
    <section className={styles.wrap} aria-label={ariaLabel}>
      <div className={styles.row} role="tablist">
        {items.map((it) => {
          const isOpen = open === it.key;
          return (
            <button
              key={it.key}
              type="button"
              role="tab"
              aria-selected={isOpen}
              className={`${styles.tab}${isOpen ? ` ${styles.tabActive}` : ""}`}
              onClick={() => toggle(it.key)}
            >
              <span
                className={styles.icon}
                data-fig={it.figIcon ? "1" : undefined}
                aria-hidden="true"
                style={{
                  maskImage: `url(${it.icon})`,
                  WebkitMaskImage: `url(${it.icon})`,
                  backgroundColor: isOpen ? colorFor(it.score) : "#B8CEE0",
                }}
              />
              <span className={styles.tabLabel}>{it.label}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <div className={styles.panel}>
          {active.caption && (
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>{active.caption}</span>
            </div>
          )}
          <div className={styles.panelText}>{renderPanel(active.key)}</div>
        </div>
      )}
    </section>
  );
}

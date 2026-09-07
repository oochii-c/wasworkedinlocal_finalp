import { useState, type ReactNode } from "react";
import { SajuExtended } from "../saju/types";
import { getYearGanZhi } from "../saju/ganzhi";
import { useFortuneYear } from "../useFortuneYear";
import styles from "./YearNav.module.css";

export interface YearNavProps {
  chart: SajuExtended;
  // 이 해 요약 카드 안에 이어 붙일 내용(월별 흐름 등)
  children?: ReactNode;
}

export function YearNav({ chart, children }: YearNavProps) {
  const year = useFortuneYear(chart);
  // getYearGanZhi 는 이미 한글 독음("병","오")을 준다 — 한자 변환을 거치지 않는다.
  const { gan, ji } = getYearGanZhi(year);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={styles.nav}>
      <div className={styles.titleRow}>
        <span className={styles.year}>
          {year} {gan}{ji}년
        </span>
        <button
          type="button"
          className={styles.helpButton}
          aria-label="월별 흐름 설명 보기"
          aria-expanded={showHelp}
          onClick={() => setShowHelp((v) => !v)}
        >
          ?
        </button>
      </div>
      {/* 토글해도 레이아웃이 밀리지 않도록 자리는 늘 차지하고 보이기만 켜고 끈다 */}
      <p className={`${styles.help} ${showHelp ? "" : styles.helpHidden}`} aria-hidden={!showHelp}>
        점을 누르면 올해 풀이도 알려줘요
      </p>
      {children && <div className={styles.extra}>{children}</div>}
    </div>
  );
}

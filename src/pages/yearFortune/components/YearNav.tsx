import { SajuExtended } from "../saju/types";
import { getYearGanZhi } from "../saju/ganzhi";
import { getDomainInterpretation } from "../saju/mock/insights";
import { useFortuneYear } from "../useFortuneYear";
import styles from "./YearNav.module.css";

export interface YearNavProps {
  chart: SajuExtended;
}

// 총운 문장을 공백 포함 30자마다 끊는다. 브라우저 자동 줄바꿈에 맡기면
// 상자 폭에 따라 끊기는 자리가 들쭉날쭉해 보기 어색했다.
const WRAP_AT = 30;

function wrapEvery(text: string, size: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += size) lines.push(text.slice(i, i + size));
  return lines;
}

export function YearNav({ chart }: YearNavProps) {
  const year = useFortuneYear(chart);
  // getYearGanZhi 는 이미 한글 독음("병","오")을 준다 — 한자 변환을 거치지 않는다.
  const { gan, ji } = getYearGanZhi(year);

  return (
    <div className={styles.nav}>
      <span className={styles.year}>
        {year} {gan}{ji}년
      </span>
      {/* 총운은 이 해 전체를 가리키므로 머리말 자리에 펼쳐 둔다.
          아래 영역별 격자의 총운 칸에서도 같은 문장을 쓴다. */}
      <p className={styles.overview}>
        {wrapEvery(getDomainInterpretation("총운", chart, year), WRAP_AT).map((line, i) => (
          <span key={i} className={styles.line}>{line}</span>
        ))}
      </p>
    </div>
  );
}

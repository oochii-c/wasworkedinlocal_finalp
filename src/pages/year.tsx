import { useEffect, useMemo, useState } from "react";
import "./yaer.css";
import { useSaju } from "../state/SajuContext";
import { DAY_GAN_INFO, HANJA_DOK, WUXING_TEXT } from "./dashboard/constants";
import { getMonthGanZhi } from "./monthGanZhi";
import {
  DOMAINS,
  type Domain,
  computeDomainScores,
  computeOverallScore,
  getDomainCaption,
  getDomainInterpretation,
  computeMonthlyScores,
  getMonthInterpretation,
  getGoodMonths,
  getCautionMonths,
  formatMonthRanges,
  GOOD_MONTH_THRESHOLD,
  CAUTION_MONTH_THRESHOLD,
} from "./yearInsights";
import { generateYearSummary, generateYearCitation } from "./yearSummary";

interface Props {
  year: number;
  onBack?: () => void;
}

// 지지 → 띠. 서버(server/index.js ZHI_ZODIAC)와 짝.
const ZHI_ZODIAC: Record<string, string> = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼",
  辰: "용", 巳: "뱀", 午: "말", 未: "양",
  申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
};

function starsDisplay(score: number): string {
  const full = Math.min(5, Math.max(0, Math.round(score)));
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export default function YearDetail({ year: initialYear, onBack }: Props) {
  const { chart } = useSaju();
  const [year, setYear] = useState(initialYear);
  useEffect(() => { setYear(initialYear); }, [initialYear]);

  const [openDomain, setOpenDomain] = useState<Domain | null>(null);
  const [showMonthPopup, setShowMonthPopup] = useState(false);
  const [showCitation, setShowCitation] = useState(false);

  const sw = chart?.seWun.find((s) => s.year === year) ?? (chart?.currentSeWun?.year === year ? chart.currentSeWun : undefined);
  const dayGan = chart?.dayGan ?? "";
  const minYear = chart?.seWun[0]?.year;
  const maxYear = chart?.seWun[chart.seWun.length - 1]?.year;

  const monthGanZhiList = useMemo(() => {
    if (!chart) return [] as string[];
    return Array.from({ length: 12 }, (_, i) => getMonthGanZhi(year, i + 1));
  }, [year, chart]);

  const monthlyScores = useMemo(() => {
    if (!chart || monthGanZhiList.length === 0) return [] as number[];
    return computeMonthlyScores(monthGanZhiList.map((gz) => gz[0]), chart.dayGan);
  }, [monthGanZhiList, chart]);

  const domainScores = useMemo(() => {
    if (!chart || !sw) return null;
    return computeDomainScores(chart.wuXingCount, chart.dayGan, sw.ganZhi[0]);
  }, [chart, sw]);

  const overallScore = domainScores ? computeOverallScore(domainScores) : (sw?.stars ?? 3);

  if (!chart || !sw) {
    return (
      <div className="yr-wrap">
        {onBack && <button type="button" className="yr-back" onClick={onBack}>← 뒤로</button>}
        <p className="db-shensha-empty">해당 연도의 세운 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const gan = sw.ganZhi[0];
  const zhi = sw.ganZhi[1];
  const ganInfo = DAY_GAN_INFO[gan];
  const dayGanInfo = DAY_GAN_INFO[dayGan];
  const zodiac = ZHI_ZODIAC[zhi] ?? zhi;
  const daYunSeg = chart.daYun.find((d) => year >= d.startYear && year <= (d.endYear ?? d.startYear + 9));
  const isCurrentYear = year === new Date().getFullYear();
  const goodMonths = formatMonthRanges(getGoodMonths(monthlyScores));
  const cautionMonths = formatMonthRanges(getCautionMonths(monthlyScores));

  const yearSummary = generateYearSummary(
    year, sw.ganZhi, dayGan, dayGanInfo?.nameKr ?? dayGan, ganInfo?.nameKr ?? gan,
    chart.wuXingCount, monthGanZhiList
  );
  const yearCitation = domainScores
    ? generateYearCitation(sw.ganZhi, dayGan, chart.wuXingCount, domainScores, monthGanZhiList)
    : "";

  return (
    <div className="yr-wrap">
      {onBack && <button type="button" className="yr-back" onClick={onBack}>← 뒤로</button>}

      <section className="db-section yr-hero">
        <div className="yr-hero-nav">
          <button
            type="button"
            className="yr-nav-arrow"
            disabled={minYear === undefined || year <= minYear}
            onClick={() => setYear((y) => y - 1)}
            aria-label="이전 해"
          >
            ‹
          </button>
          <div className="yr-hero-main">
            <div className="yr-hero-year">{year}년{isCurrentYear ? <span className="yr-hero-now"> · 올해</span> : null}</div>
            <div className="yr-hero-ganzhi" style={{ color: ganInfo ? WUXING_TEXT[ganInfo.element] : undefined }}>
              {sw.ganZhi}
            </div>
            <div className="yr-hero-dok">
              {HANJA_DOK[gan] ?? gan}{HANJA_DOK[zhi] ?? zhi} · {zodiac}의 해
            </div>
            <div className="yr-hero-stars">{starsDisplay(overallScore)}</div>
          </div>
          <button
            type="button"
            className="yr-nav-arrow"
            disabled={maxYear === undefined || year >= maxYear}
            onClick={() => setYear((y) => y + 1)}
            aria-label="다음 해"
          >
            ›
          </button>
        </div>
      </section>

      <section className="db-section" aria-label="일간과의 관계">
        <h3 className="db-section-title">일간과의 관계</h3>
        <p className="yr-rel-line">
          일간 {dayGan}({dayGanInfo?.nameKr ?? "?"}) × 세운 {gan}({ganInfo?.nameKr ?? "?"}) = <strong>{sw.rel}</strong>
        </p>
        {daYunSeg && (
          <p className="yr-dayun-line">
            {daYunSeg.startAge}~{daYunSeg.endAge ?? daYunSeg.startAge + 9}세 대운({daYunSeg.ganZhi}) 시기에 속한 해예요.
          </p>
        )}
      </section>

      <section className="db-section" aria-label="영역별 운세">
        <h3 className="db-section-title">영역별 운세</h3>
        <div className="yr-domain-grid">
          {DOMAINS.map((domain) => {
            const score = domainScores?.[domain] ?? 3;
            const isOpen = openDomain === domain;
            return (
              <div key={domain} className="yr-domain-cell">
                <div className="yr-domain-head">
                  <span className="yr-domain-label">{domain}</span>
                  <button
                    type="button"
                    className="yr-info-btn"
                    aria-label={`${domain} 설명 보기`}
                    onClick={() => setOpenDomain((p) => (p === domain ? null : domain))}
                  >
                    ?
                  </button>
                </div>
                <div className="yr-domain-stars">{starsDisplay(score)}</div>
                <div className="yr-domain-caption">{getDomainCaption(domain, score)}</div>
                {isOpen && (
                  <p className="yr-domain-desc">{getDomainInterpretation(domain, chart.wuXingCount, dayGan, gan)}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="db-section" aria-label="월별 흐름">
        <div className="yr-section-head-row">
          <h3 className="db-section-title yr-no-margin">월별 흐름</h3>
          <button
            type="button"
            className="yr-month-detail-btn"
            aria-label="월별 간지 보기"
            onClick={() => setShowMonthPopup((p) => !p)}
          >
            월별 자세히
          </button>
        </div>

        {showMonthPopup && (
          <ul className="yr-month-popup">
            {monthGanZhiList.map((gz, i) => (
              <li key={i} className="yr-month-popup-item">
                <span className="yr-month-popup-month">{i + 1}월 {gz}</span>
                <span className="yr-month-popup-text">{getMonthInterpretation(gz[0], dayGan)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="yr-month-bars">
          {monthlyScores.map((score, i) => (
            <div key={i} className="yr-month-col">
              <div
                className={`yr-month-bar${score >= GOOD_MONTH_THRESHOLD ? " is-good" : score <= CAUTION_MONTH_THRESHOLD ? " is-caution" : ""}`}
                style={{ height: `${(score / 5) * 100}%` }}
              />
              <span className="yr-month-label">{i + 1}월</span>
            </div>
          ))}
        </div>

        <div className="yr-month-legend">
          <span className="yr-legend-item"><span className="yr-legend-swatch is-good" />좋은 달</span>
          <span className="yr-legend-item"><span className="yr-legend-swatch is-caution" />주의 달</span>
        </div>
      </section>

      <section className="db-section yr-goodbad" aria-label="좋은/주의 시기">
        <div className="yr-callout yr-callout-good">
          <div className="yr-callout-title"><span aria-hidden="true">✨</span> 좋은 시기</div>
          <div className="yr-callout-range">{goodMonths}</div>
          <div className="yr-callout-caption">기운이 잘 풀리는 시기예요. 중요한 결정을 내리기 좋아요.</div>
        </div>
        <div className="yr-callout yr-callout-caution">
          <div className="yr-callout-title"><span aria-hidden="true">⚠️</span> 주의 시기</div>
          <div className="yr-callout-range">{cautionMonths}</div>
          <div className="yr-callout-caption">무리하지 말고 한 박자 쉬어가는 게 좋아요.</div>
        </div>
      </section>

      <section className="db-section" aria-label="용왕님의 세운 풀이">
        <h3 className="db-section-title">용왕님의 세운 풀이</h3>
        <p className="yr-fortune-text">{yearSummary}</p>
        <button
          type="button"
          className="yr-citation-toggle"
          aria-label={showCitation ? "근거 숨기기" : "근거 보기"}
          onClick={() => setShowCitation((p) => !p)}
        >
          {showCitation ? "근거 숨기기 ▲" : "근거 보기 ▼"}
        </button>
        {showCitation && (
          <p className="yr-citation" data-testid="yr-citation-block">
            근거: {yearCitation}
          </p>
        )}
      </section>
    </div>
  );
}

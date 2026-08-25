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

// 별점 대신 바닷속 동물 5칸 — 영역마다 다른 동물(꽃게·물고기·불가사리·거북이·해파리·고래)을
// 배정. 채워지면 금빛 실루엣 + 은은한 광채로 빛나고, 비면 무채색 실루엣만 남음.
type Creature = "pearl" | "crab" | "fish" | "starfish" | "turtle" | "jellyfish" | "whale";

const DOMAIN_CREATURE: Record<Domain, Creature> = {
  총운: "crab",
  애정: "fish",
  재물: "starfish",
  직업학업: "jellyfish",
  건강: "turtle",
  인간관계: "whale",
};

function CreatureSilhouette({ creature, color }: { creature: Creature; color: string }) {
  switch (creature) {
    case "pearl":
      return <circle cx="10" cy="10" r="5.2" fill={color} />;
    case "crab":
      return (
        <>
          <ellipse cx="10" cy="12" rx="5.8" ry="4.2" fill={color} />
          <circle cx="7.5" cy="7.6" r="0.8" fill={color} />
          <circle cx="12.5" cy="7.6" r="0.8" fill={color} />
          <line x1="8" y1="9" x2="7.5" y2="8" stroke={color} strokeWidth="0.7" />
          <line x1="12" y1="9" x2="12.5" y2="8" stroke={color} strokeWidth="0.7" />
          {/* 집게발 */}
          <path d="M5 10 Q1.5 8 1 5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <ellipse cx="1" cy="3.3" rx="1.7" ry="1.2" transform="rotate(-35 1 3.3)" fill={color} />
          <path d="M15 10 Q18.5 8 19 5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <ellipse cx="19" cy="3.3" rx="1.7" ry="1.2" transform="rotate(35 19 3.3)" fill={color} />
          {/* 다리 */}
          <line x1="5" y1="13" x2="1.5" y2="14.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="5.5" y1="15" x2="2.5" y2="17" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="15" y1="13" x2="18.5" y2="14.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="14.5" y1="15" x2="17.5" y2="17" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
        </>
      );
    case "fish":
      return (
        <>
          <path d="M4 10 C4 7 8 6 13 7 C16 7.6 17.5 9 17.5 10 C17.5 11 16 12.4 13 13 C8 14 4 13 4 10 Z" fill={color} />
          <path d="M4 10 L1 7.5 L2 10 L1 12.5 Z" fill={color} />
        </>
      );
    case "starfish":
      return (
        <path
          d="M10 3 L11.76 7.57 L16.66 7.84 L12.85 10.93 L14.11 15.66 L10 13 L5.89 15.66 L7.15 10.93 L3.34 7.84 L8.24 7.57 Z"
          fill={color}
        />
      );
    case "turtle":
      return (
        <>
          {/* 옆으로 안 퍼지게 등딱지를 원형에 가깝게, 다리도 몸통에 바짝 붙여서 */}
          <circle cx="10" cy="11" r="6" fill={color} />
          <circle cx="10" cy="4.3" r="1.8" fill={color} />
          <circle cx="4.3" cy="7.5" r="1.3" fill={color} />
          <circle cx="15.7" cy="7.5" r="1.3" fill={color} />
          <circle cx="4.6" cy="14.5" r="1.3" fill={color} />
          <circle cx="15.4" cy="14.5" r="1.3" fill={color} />
        </>
      );
    case "jellyfish":
      return (
        <>
          {/* 둥근 머리(우산) 대신 아래가 평평한 종(bell) 모양으로 문어와 구분 */}
          <path d="M4 9 A6 6 0 0 1 16 9 Z" fill={color} />
          <path d="M5.5 9 Q5 13 6 17" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M8 9 Q7.5 14 8.5 18.5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M10 9 Q10 15 10 19" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M12 9 Q12.5 14 11.5 18.5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M14.5 9 Q15 13 14 17" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </>
      );
    case "whale":
      return (
        <>
          {/* 통통한 반달 몸통 (꼬리 쪽은 짧게 끝내서 지느러미가 밖으로 튀어나오게) */}
          <path d="M2 17 Q1 9 8 6.5 Q15 4.5 17 9.5 Q17.6 11.8 14.8 13.2 Q7.5 20 2 17 Z" fill={color} />
          {/* 꼬리 지느러미 — 몸통 밖으로 확실히 튀어나오는 두 갈래 fluke */}
          <path d="M14.8 13.2 Q17.5 12 19.5 9.3 Q19.2 12.5 20 14.2 Q18.6 15.8 16.4 15 Q15.4 14.4 14.8 13.2 Z" fill={color} />
          {/* 가슴 지느러미 */}
          <path d="M11.5 16.5 Q14 18 12.5 19.3 Q10.8 18.3 11.5 16.5 Z" fill={color} />
          {/* 눈 */}
          <circle cx="13" cy="10.8" r="0.6" fill={color} />
          {/* 두 갈래로 갈라지는 물줄기 */}
          <path d="M7.7 6.5 Q6.8 3.3 5.3 1.3 Q6.9 1.8 8 4.2 Q9.1 1.8 10.7 1.3 Q9.3 3.5 8.4 6.3 Z" fill={color} />
          <circle cx="3.8" cy="2.2" r="0.5" fill={color} />
          <circle cx="12.2" cy="2" r="0.5" fill={color} />
        </>
      );
  }
}

function CreatureIcon({ creature, filled }: { creature: Creature; filled: boolean }) {
  const color = filled ? "#FFF6DD" : "rgba(184,206,224,0.16)";
  const stroke = filled ? "#EACB8A" : "rgba(184,206,224,0.4)";
  return (
    <svg className="yr-pearl" viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
      {filled && (
        <>
          <circle cx="10" cy="10" r="9" fill="#EACB8A" opacity="0.14" />
          <circle cx="10" cy="10" r="6.6" fill="#EACB8A" opacity="0.22" />
        </>
      )}
      <g stroke={stroke} strokeWidth="0.6" strokeLinejoin="round">
        <CreatureSilhouette creature={creature} color={color} />
      </g>
      {filled && (
        <g stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round">
          <line x1="6.9" y1="7.4" x2="9" y2="7.4" />
          <line x1="7.95" y1="6.35" x2="7.95" y2="8.45" />
        </g>
      )}
    </svg>
  );
}

function shellRow(score: number, creature: Creature = "pearl") {
  const filled = Math.min(5, Math.max(0, Math.round(score)));
  return (
    <span className="yr-shell-row">
      {Array.from({ length: 5 }, (_, i) => (
        <CreatureIcon key={i} creature={creature} filled={i < filled} />
      ))}
    </span>
  );
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
            {shellRow(overallScore)}
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
                {shellRow(score, DOMAIN_CREATURE[domain])}
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

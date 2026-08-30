import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/saju.css"; // --saju-* 토큰
import "./today.css";
import { useSaju } from "../../state/SajuContext";
import { computeDailyInfo, seWunScore, type DailyInfo } from "../../saju";
import { HANJA_DOK } from "../dashboard/constants";
import { getDailyFortune, type DailyFortune } from "../../services/sajuApi";
import WhirlLoader from "../../components/WhirlLoader";
import DailyAiCard from "./DailyAiCard";

// 오늘 하루 AI 풀이 — 원국 signature + 날짜 키로 캐시(같은 날 재진입 시 재호출 X, 자정 넘기면 새 키).
function useDailyFortuneReading(daily: DailyInfo, baZi: string[], dayGan: string, shenSha: string[]) {
  const { readCache, writeCache } = useSaju();
  const key = `daily:${baZi.join("")}:${daily.date}`;
  const { rel, stars } = seWunScore(daily.dayGan, dayGan);

  const [data, setData] = useState<DailyFortune | null>(() => readCache<DailyFortune>(key) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    const cached = readCache<DailyFortune>(key);
    if (cached) { setData(cached); return; }
    setLoading(true);
    setError("");
    try {
      const res = await getDailyFortune({
        dayGan,
        dayGanZhi: daily.dayGanZhi,
        monthGanZhi: daily.monthGanZhi,
        yearGanZhi: daily.yearGanZhi,
        rel,
        stars,
        jianChu: daily.jianChu.ko,
        tianShen: daily.tianShen.ko,
        tianShenLuck: daily.tianShenLuck,
        jiShen: daily.jiShen.map((t) => t.ko),
        xiongSha: daily.xiongSha.map((t) => t.ko),
        yi: daily.yi.map((t) => t.ko),
        ji: daily.ji.map((t) => t.ko),
        chong: daily.chongTti ? `${daily.chongTti}띠와 충` : "",
        positionCai: daily.positionCai,
        positionXi: daily.positionXi,
        shenSha,
      });
      writeCache(key, res);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "풀이 생성 실패");
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, retry: run };
}

const BAND_CLASS: Record<string, string> = {
  대길: "is-daegil", 길: "is-gil", 평: "is-pyeong", 흉: "is-hyung", 대흉: "is-daehyung",
};

export default function Today() {
  const { chart } = useSaju();
  const daily = useMemo(
    () => computeDailyInfo(new Date(), chart?.dayGan),
    [chart?.dayGan]
  );
  const [showReasons, setShowReasons] = useState(false);

  const shenShaNames = useMemo(
    () => (chart?.shenSha ?? []).map((s) => s.name),
    [chart]
  );

  const { data, loading, error, retry } = useDailyFortuneReading(
    daily,
    chart?.baZi ?? [],
    chart?.dayGan ?? "",
    shenShaNames
  );

  if (!chart) return null; // Router/Dashboard가 보장하지만 타입 가드

  const { rel } = seWunScore(daily.dayGan, chart.dayGan);
  const { stars, band, pct, reasons } = daily.dayStrength;
  const [y, m, d] = daily.date.split("-");
  const starLine = "★".repeat(stars) + "☆".repeat(5 - stars);
  const dok = (ch: string) => HANJA_DOK[ch] ?? "";

  return (
    <>
      {/* 블록 1: 오늘 일진 히어로 */}
      <section className="db-section" aria-label="오늘 일진">
        <h3 className="db-section-title">오늘의 운세</h3>
        <div className="today-hero">
          <div className="today-hero-ganzhi">
            <span className="today-hero-hanja">{daily.dayGanZhi || "?"}</span>
            <span className="today-hero-dok">
              {dok(daily.dayGan)}{dok(daily.dayZhi)}일
            </span>
          </div>
          <div className="today-hero-meta">
            <p className="today-hero-date">
              {y}.{m}.{d} ({daily.weekday})
            </p>
            <div className="today-band-row">
              <span className={`today-band ${BAND_CLASS[band] ?? ""}`}>{band}</span>
              <span className="today-stars" aria-label={`${stars}점 / 5점`}>{starLine}</span>
              <span className="today-band-pct">{pct}/100</span>
            </div>
            <p className="today-hero-rel">
              내 일간 {chart.dayGan}{dok(chart.dayGan) && `(${dok(chart.dayGan)})`}과(와) 오늘 기운은 <b>{rel}</b>
            </p>
            <button
              type="button"
              className="today-reasons-toggle"
              onClick={() => setShowReasons((v) => !v)}
              aria-expanded={showReasons}
            >
              {showReasons ? "접기 ▲" : "자세히 ▼"}
            </button>
          </div>
        </div>
        {showReasons && (
          <ul className="today-reasons">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </section>

      {/* 블록 2: 오늘의 기운 — 건제·십이신·충·신살·방위를 묶은 2~3문장 풀이 */}
      <section className="db-section" aria-label="오늘의 기운">
        <h3 className="db-section-title">오늘의 기운</h3>
        <div className="db-ai-box">
          {data?.energy ? (
            <p className="db-ai-body">{data.energy}</p>
          ) : loading ? (
            <p className="db-ai-body" style={{ color: "#ffffff" }}>
              <WhirlLoader />오늘의 기운을 읽는 중...
            </p>
          ) : (
            <p className="db-ai-body">오늘의 기운을 불러오지 못했어요.</p>
          )}
        </div>
      </section>

      {/* 블록 3: AI 총평 */}
      <DailyAiCard data={data} loading={loading} onRetry={error ? retry : undefined} />
    </>
  );
}

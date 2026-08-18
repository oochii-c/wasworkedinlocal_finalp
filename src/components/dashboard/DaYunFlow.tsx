import { useState, useMemo, useEffect, useRef } from "react";
import { type DaYunInfo, type SeWunInfo, seWunScore } from "../../saju";

interface Props {
  daYun: DaYunInfo[];
  seWun: SeWunInfo[];
  currentSeWun?: SeWunInfo;
  birthYear: number;
  dayGan: string;
}

function starsDisplay(n: number) {
  const full = Math.min(Math.round(n), 5);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// catmull-rom → cubic bezier
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  const get = (i: number) => pts[Math.max(0, Math.min(i, pts.length - 1))];
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = get(i - 1), p1 = pts[i], p2 = pts[i + 1], p3 = get(i + 2);
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

const W = 320, H = 80, PX = 16, PY = 12;

export default function DaYunFlow({ daYun, seWun, currentSeWun, birthYear, dayGan }: Props) {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  // 대운 자체 天干 vs 일간 → 실제 높낮이
  const daYunAvgs = useMemo(() => daYun.map(dy => {
    const score = seWunScore(dy.ganZhi[0], dayGan);
    const startY = dy.startYear;
    const endY = dy.endYear ?? startY + 9;
    return { dy, stars: score.stars, rel: score.rel, startYear: startY, endYear: endY };
  }), [daYun, dayGan]);

  const currentDaYunIdx = daYunAvgs.findIndex(
    d => d.startYear <= currentYear && currentYear <= d.endYear
  );

  const [selectedDaYunIdx, setSelectedDaYunIdx] = useState(
    currentDaYunIdx >= 0 ? currentDaYunIdx : 0
  );
  // 대운 클릭 → startYear, 올해 마커 클릭 → currentYear
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // 세운 전체 범위
  const globalMin = seWun[0]?.year ?? currentYear;
  const globalMax = seWun[seWun.length - 1]?.year ?? currentYear;

  // 년도 변경 시 대운 인덱스도 동기화
  function handleYearChange(newYear: number) {
    const clamped = Math.min(globalMax, Math.max(globalMin, newYear));
    setSelectedYear(clamped);
    const newDaYunIdx = daYunAvgs.findIndex(
      d => d.startYear <= clamped && clamped <= d.endYear
    );
    if (newDaYunIdx >= 0) setSelectedDaYunIdx(newDaYunIdx);
  }

  const selectedSW = useMemo(
    () => seWun.find(s => s.year === selectedYear) ?? currentSeWun,
    [seWun, selectedYear, currentSeWun]
  );

  // AI 연도 운세 캐시 (컴포넌트 생애 동안 유지)
  const fortuneCache = useRef<Record<string, string>>({});
  const [fortuneText, setFortuneText] = useState<string | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [fortuneError, setFortuneError] = useState(false);

  useEffect(() => {
    if (!selectedSW) return;

    const cacheKey = `${dayGan}-${selectedYear}`;

    // 캐시 히트 → 즉시 표시
    if (fortuneCache.current[cacheKey]) {
      setFortuneText(fortuneCache.current[cacheKey]);
      setFortuneLoading(false);
      setFortuneError(false);
      return;
    }

    setFortuneLoading(true);
    setFortuneText(null);
    setFortuneError(false);

    const controller = new AbortController();

    fetch("/api/year-fortune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: selectedYear,
        ganZhi: selectedSW.ganZhi,
        rel: selectedSW.rel,
        dayGan,
        stars: selectedSW.stars,
      }),
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const text = typeof data.text === "string" && data.text ? data.text : null;
        if (text) {
          fortuneCache.current[cacheKey] = text; // 성공한 응답만 캐시
          setFortuneText(text);
        } else {
          setFortuneError(true);
        }
      })
      .catch(err => {
        if (err.name !== "AbortError") setFortuneError(true);
      })
      .finally(() => setFortuneLoading(false));

    return () => controller.abort();
  }, [selectedYear, selectedSW, dayGan]);

  if (daYunAvgs.length === 0) {
    return (
      <section className="db-section" aria-label="인생 흐름 대운">
        <h3 className="db-section-title">인생 흐름 (대운)</h3>
        <p className="db-shensha-empty">대운 정보를 계산할 수 없습니다</p>
      </section>
    );
  }

  // 그래프 좌표: 균등 배치
  const n = daYunAvgs.length;
  const gPoints = daYunAvgs.map((d, i) => ({
    x: n > 1 ? PX + (i / (n - 1)) * (W - PX * 2) : W / 2,
    y: PY + (H - PY * 2) * (1 - (d.stars - 1) / 4),
  }));

  const pathD = smoothPath(gPoints);
  const selectedGPt = gPoints[selectedDaYunIdx];

  // 현재 년도 보간 위치
  let currentYearX: number | null = null;
  if (currentDaYunIdx >= 0) {
    const curDY = daYunAvgs[currentDaYunIdx];
    const startPt = gPoints[currentDaYunIdx];
    const nextPt = gPoints[currentDaYunIdx + 1];
    if (nextPt) {
      const dyLen = curDY.endYear - curDY.startYear;
      const elapsed = currentYear - curDY.startYear;
      const frac = dyLen > 0 ? Math.min(1, elapsed / dyLen) : 0;
      currentYearX = startPt.x + frac * (nextPt.x - startPt.x);
    } else {
      currentYearX = startPt.x;
    }
  }

  // 올해 마커 클릭 영역 (±18px — 대운 클릭보다 위에 렌더)
  const NOW_ZONE = 18;

  return (
    <section className="db-section" aria-label="인생 흐름 대운">
      <h3 className="db-section-title">인생 흐름 (대운)</h3>

      <div className="db-dayun-graph-wrap">
        <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" style={{ display: "block" }} aria-hidden="true">
          {/* 격자 */}
          {[1, 2, 3, 4, 5].map(star => {
            const y = PY + (H - PY * 2) * (1 - (star - 1) / 4);
            return <line key={star} x1={PX} x2={W - PX} y1={y} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
          })}

          {/* 베지어 곡선 */}
          <path d={pathD} fill="none"
            stroke="rgba(184,206,224,0.5)" strokeWidth="1.5" />

          {/* 선택 대운 수직선 (점선) */}
          <line
            x1={selectedGPt.x} x2={selectedGPt.x}
            y1={PY} y2={H - PY}
            stroke="rgba(234,203,138,0.4)" strokeWidth="1" strokeDasharray="3 2"
          />

          {/* 현재 년도 위치 마커 (실선) */}
          {currentYearX !== null && (
            <>
              <line
                x1={currentYearX} x2={currentYearX}
                y1={PY} y2={H - PY}
                stroke="rgba(234,203,138,0.85)" strokeWidth="1.5"
              />
              <circle cx={currentYearX} cy={H - PY} r={3} fill="#EACB8A" />
              <text x={currentYearX} y={PY - 3}
                fontSize="8.5" textAnchor="middle" fill="#EACB8A" fontWeight="700">
                지금 {currentAge}세
              </text>
            </>
          )}

          {/* 대운 클릭 영역 — 세그먼트 전체 폭 */}
          {gPoints.map((pt, i) => {
            const prevX = i > 0 ? (gPoints[i - 1].x + pt.x) / 2 : PX - 8;
            const nextX = i < gPoints.length - 1 ? (pt.x + gPoints[i + 1].x) / 2 : W - PX + 8;
            return (
              <rect key={i}
                x={prevX} y={4}
                width={nextX - prevX} height={H}
                fill="transparent" style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedDaYunIdx(i);
                  // 항상 startYear — 올해 이동은 올해 마커로
                  setSelectedYear(daYunAvgs[i].startYear);
                }}
              />
            );
          })}

          {/* 점 */}
          {gPoints.map((pt, i) => (
            <circle key={`dot-${i}`} cx={pt.x} cy={pt.y}
              r={i === selectedDaYunIdx ? 4.5 : 3}
              fill={i === selectedDaYunIdx ? "#EACB8A" : "rgba(184,206,224,0.55)"}
              style={{ pointerEvents: "none" }}
            />
          ))}

          {/* 올해 마커 클릭 영역 — 大運 dot 변경 없이 연도만 이동 */}
          {currentYearX !== null && (
            <rect
              x={currentYearX - NOW_ZONE} y={4}
              width={NOW_ZONE * 2} height={H}
              fill="transparent" style={{ cursor: "pointer" }}
              onClick={() => setSelectedYear(currentYear)}
            />
          )}

          {/* X축 연도 레이블 */}
          {daYunAvgs.map((d, i) => (
            <text key={i} x={gPoints[i].x} y={H + 16}
              fontSize="8" textAnchor="middle"
              fill={i === selectedDaYunIdx ? "rgba(234,203,138,0.9)" : "rgba(184,206,224,0.4)"}
              fontWeight={i === selectedDaYunIdx ? "700" : "400"}
              style={{ pointerEvents: "none" }}
            >
              {d.startYear}
            </text>
          ))}
        </svg>
      </div>

      {selectedSW && (
        <div className="db-dayun-card">
          <div className="db-dayun-year-nav">
            <button
              type="button"
              className="db-dayun-nav-btn"
              disabled={selectedYear <= globalMin}
              onClick={() => handleYearChange(selectedYear - 1)}
              aria-label="이전 연도"
            >
              ←
            </button>
            <span className="db-dayun-card-year">
              {selectedYear}년{selectedYear === currentYear ? " (올해)" : ""}{" "}
              <span className="db-dayun-stars">{starsDisplay(selectedSW.stars)}</span>
            </span>
            <button
              type="button"
              className="db-dayun-nav-btn"
              disabled={selectedYear >= globalMax}
              onClick={() => handleYearChange(selectedYear + 1)}
              aria-label="다음 연도"
            >
              →
            </button>
          </div>
          <div className="db-dayun-card-basis">
            세운 {selectedSW.ganZhi} × 일간 {dayGan} = {selectedSW.rel}
          </div>
          <div className="db-dayun-card-text">
            {fortuneLoading ? (
              <span className="db-dayun-fortune-loading">운세 풀이 중...</span>
            ) : fortuneError ? (
              <span className="db-dayun-fortune-loading">서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.</span>
            ) : (
              fortuneText ?? ""
            )}
          </div>
          <button type="button" className="db-dayun-detail-btn">
            그 해 자세히 보기 →
          </button>
        </div>
      )}
    </section>
  );
}

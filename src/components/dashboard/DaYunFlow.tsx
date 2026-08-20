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
  // 올해 마커 클릭 시 점을 보간 위치로 이동할지 여부
  const [isCurrentYearDot, setIsCurrentYearDot] = useState(false);

  // 세운 전체 범위
  const globalMin = seWun[0]?.year ?? currentYear;
  const globalMax = seWun[seWun.length - 1]?.year ?? currentYear;

  // 년도 변경 시 대운 인덱스도 동기화 (← → 버튼 / 대운 클릭 공용)
  function handleYearChange(newYear: number) {
    const clamped = Math.min(globalMax, Math.max(globalMin, newYear));
    setSelectedYear(clamped);
    setIsCurrentYearDot(false);
    const newDaYunIdx = daYunAvgs.findIndex(
      d => d.startYear <= clamped && clamped <= d.endYear
    );
    if (newDaYunIdx >= 0) setSelectedDaYunIdx(newDaYunIdx);
  }

  const selectedSW = useMemo(
    () => seWun.find(s => s.year === selectedYear) ?? currentSeWun,
    [seWun, selectedYear, currentSeWun]
  );

  /*
   * fortuneCache: 이미 불러온 연도 운세를 저장해두는 캐시
   * - key: `일간-연도` (예: "辛-2026")
   * - value: AI가 생성한 운세 텍스트
   * - useRef 사용 이유: 값이 바뀌어도 리렌더를 일으키지 않음.
   *   useState로 만들면 캐시 저장할 때마다 불필요한 리렌더 발생.
   *   컴포넌트가 화면에 있는 동안 계속 유지됨 (다른 연도 갔다 돌아와도 살아있음).
   */
  const fortuneCache = useRef<Record<string, string>>({});
  const [fortuneText, setFortuneText] = useState<string | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [fortuneError, setFortuneError] = useState(false);

  useEffect(() => {
    if (!selectedSW) return;

    // 같은 일간이라도 연도마다 다른 텍스트를 캐시하기 위해 두 값을 합쳐 키 생성
    const cacheKey = `${dayGan}-${selectedYear}`;

    // 이미 호출한 적 있는 연도면 캐시에서 꺼내서 바로 표시 → API 재호출 없음
    if (fortuneCache.current[cacheKey]) {
      setFortuneText(fortuneCache.current[cacheKey]);
      setFortuneLoading(false);
      setFortuneError(false);
      return;
    }

    setFortuneLoading(true);
    setFortuneText(null);
    setFortuneError(false);

    /*
     * AbortController: 사용자가 ← → 를 빠르게 눌러 연도를 바꿀 때
     * 이전 연도의 진행 중인 fetch 요청을 취소하는 용도.
     * 예) 2020 → 2021 → 2022 순서로 빠르게 이동하면
     *     2020, 2021 요청은 abort되고 2022 요청만 완료됨.
     * 이렇게 하지 않으면 2020 응답이 늦게 도착해
     *     2022 텍스트 위에 2020 텍스트가 덮어써지는 버그가 생김.
     */
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
      signal: controller.signal, // 이 signal이 abort되면 fetch 자동 취소
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const text = typeof data.text === "string" && data.text ? data.text : null;
        if (text) {
          // 성공한 응답만 캐시에 저장 (빈 문자열·오류는 저장 안 함 → 나중에 재시도 가능)
          fortuneCache.current[cacheKey] = text;
          setFortuneText(text);
        } else {
          setFortuneError(true);
        }
      })
      .catch(err => {
        // AbortError는 연도 이동으로 인한 정상 취소 → 에러 표시 안 함
        // 그 외(네트워크 오류, 서버 오류 등)는 에러 메시지 표시
        if (err.name !== "AbortError") setFortuneError(true);
      })
      .finally(() => setFortuneLoading(false));

    // useEffect 클린업: selectedYear가 바뀌면 이전 fetch를 abort
    return () => controller.abort();
  }, [selectedYear, selectedSW, dayGan]);

  if (daYunAvgs.length === 0) {
    return (
      <section className="db-section" aria-label="인생 흐름">
        <h3 className="db-section-title">인생 흐름</h3>
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

  // 현재 년도 보간 위치 (X, Y 모두)
  let currentYearX: number | null = null;
  let currentYearY: number | null = null;
  if (currentDaYunIdx >= 0) {
    const curDY = daYunAvgs[currentDaYunIdx];
    const startPt = gPoints[currentDaYunIdx];
    const nextPt = gPoints[currentDaYunIdx + 1];
    if (nextPt) {
      const dyLen = curDY.endYear - curDY.startYear;
      const elapsed = currentYear - curDY.startYear;
      const frac = dyLen > 0 ? Math.min(1, elapsed / dyLen) : 0;
      currentYearX = startPt.x + frac * (nextPt.x - startPt.x);
      currentYearY = startPt.y + frac * (nextPt.y - startPt.y);
    } else {
      currentYearX = startPt.x;
      currentYearY = startPt.y;
    }
  }

  // 올해 선택 시 보간 위치, 아닐 때는 선택 대운 경계점
  const activePt =
    isCurrentYearDot && currentYearX !== null && currentYearY !== null
      ? { x: currentYearX, y: currentYearY }
      : selectedGPt;

  // 올해 마커 클릭 영역 (±18px — 대운 클릭보다 위에 렌더)
  const NOW_ZONE = 18;

  return (
    <section className="db-section" aria-label="인생 흐름">
      <h3 className="db-section-title">인생 흐름</h3>

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

          {/* 선택 위치 수직선 (점선) — 올해 선택 시 보간 위치, 아닐 때 대운 경계 */}
          <line
            x1={activePt.x} x2={activePt.x}
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
                fontSize="10" textAnchor="middle" fill="#EACB8A" fontWeight="700">
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
                  setIsCurrentYearDot(false);
                  setSelectedYear(daYunAvgs[i].startYear);
                }}
              />
            );
          })}

          {/* 점 — 올해 선택 시 모든 경계점은 기본 크기로, 보간 위치에 별도 강조점 */}
          {gPoints.map((pt, i) => (
            <circle key={`dot-${i}`} cx={pt.x} cy={pt.y}
              r={!isCurrentYearDot && i === selectedDaYunIdx ? 4.5 : 3}
              fill={!isCurrentYearDot && i === selectedDaYunIdx ? "#EACB8A" : "rgba(184,206,224,0.55)"}
              style={{ pointerEvents: "none" }}
            />
          ))}
          {isCurrentYearDot && currentYearX !== null && currentYearY !== null && (
            <circle
              cx={currentYearX} cy={currentYearY}
              r={4.5} fill="#EACB8A"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* 올해 마커 클릭 영역 — 보간 위치로 점 이동 */}
          {currentYearX !== null && (
            <rect
              x={currentYearX - NOW_ZONE} y={4}
              width={NOW_ZONE * 2} height={H}
              fill="transparent" style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedYear(currentYear);
                setIsCurrentYearDot(true);
                if (currentDaYunIdx >= 0) setSelectedDaYunIdx(currentDaYunIdx);
              }}
            />
          )}

          {/* X축 연도 레이블 */}
          {daYunAvgs.map((d, i) => (
            <text key={i} x={gPoints[i].x} y={H + 16}
              fontSize="9.5" textAnchor="middle"
              fill={i === selectedDaYunIdx ? "rgba(234,203,138,0.95)" : "rgba(184,206,224,0.6)"}
              fontWeight={i === selectedDaYunIdx ? "700" : "500"}
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

import { useState, useMemo, useEffect, useRef } from "react";
import { type DaYunInfo, seWunScore } from "../../saju";
import { getDaYunFortune } from "../../services/sajuApi";
import WhirlLoader from "../../components/WhirlLoader";

interface Props {
  daYun: DaYunInfo[];
  birthYear: number;
  dayGan: string;
}

const GAN_KOR: Record<string, string> = {
  甲:"갑",乙:"을",丙:"병",丁:"정",戊:"무",己:"기",庚:"경",辛:"신",壬:"임",癸:"계",
};
const ZHI_KOR: Record<string, string> = {
  子:"자",丑:"축",寅:"인",卯:"묘",辰:"진",巳:"사",午:"오",未:"미",申:"신",酉:"유",戌:"술",亥:"해",
};

function ganZhiKor(gz: string): string {
  const kor = (GAN_KOR[gz[0]] ?? "") + (ZHI_KOR[gz[1]] ?? "");
  return kor ? `${kor}(${gz})` : gz;
}


function starsDisplay(n: number) {
  const full = Math.min(Math.round(n), 5);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

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

export default function DaYunFlow({ daYun, birthYear, dayGan }: Props) {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  const daYunAvgs = useMemo(() => {
    return daYun
      // ganZhi가 비어있는 첫 항목(대운 대기 기간)은 그래프·카드에서 제외
      .filter(dy => dy.ganZhi.length === 2)
      .map(dy => {
        const score = seWunScore(dy.ganZhi[0], dayGan);
        const startY = dy.startYear;
        const endY = dy.endYear ?? startY + 9;
        return { dy, stars: score.stars, rel: score.rel, startYear: startY, endYear: endY };
      });
  }, [daYun, dayGan]);

  const currentDaYunIdx = daYunAvgs.findIndex(
    d => d.startYear <= currentYear && currentYear <= d.endYear
  );

  const [selectedIdx, setSelectedIdx] = useState(
    currentDaYunIdx >= 0 ? currentDaYunIdx : 0
  );

  const fortuneCache = useRef<Record<string, string>>({});
  const [fortuneText, setFortuneText] = useState<string | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [fortuneError, setFortuneError] = useState(false);

  const selected = daYunAvgs[selectedIdx];

  useEffect(() => {
    if (!selected) return;
    const cacheKey = `${dayGan}-${selected.dy.ganZhi}`;

    if (fortuneCache.current[cacheKey]) {
      setFortuneText(fortuneCache.current[cacheKey]);
      setFortuneLoading(false);
      setFortuneError(false);
      return;
    }

    setFortuneLoading(true);
    setFortuneError(false);

    getDaYunFortune({
      dayGan,
      ganZhi: selected.dy.ganZhi,
      startYear: selected.startYear,
      endYear: selected.endYear,
      rel: selected.rel,
      stars: selected.stars,
    })
      .then(text => {
        fortuneCache.current[cacheKey] = text;
        setFortuneText(text);
      })
      .catch(() => setFortuneError(true))
      .finally(() => setFortuneLoading(false));
  }, [selected, dayGan]);

  if (daYunAvgs.length === 0) {
    return (
      <section className="db-section" aria-label="인생 흐름">
        <h3 className="db-section-title">인생 흐름(대운)</h3>
        <p className="db-shensha-empty">대운 정보를 계산할 수 없습니다</p>
      </section>
    );
  }

  const n = daYunAvgs.length;
  // gPoints: n개 점을 PX~W-PX 구간의 0/n ~ (n-1)/n 위치에 배치 — 마지막 자리(W-PX)는 endPoint용
  const gPoints = daYunAvgs.map((d, i) => ({
    x: PX + (i / n) * (W - PX * 2),
    y: PY + (H - PY * 2) * (1 - (d.stars - 1) / 4),
  }));

  // 마지막 대운의 끝년도를 나타내는 가상 종료점 (Y는 마지막 점과 동일)
  const endPoint = { x: W - PX, y: gPoints[n - 1].y };
  const pathD = smoothPath([...gPoints, endPoint]);

  // 현재 연도 그래프 상 X·Y 위치 (선형 보간)
  let currentYearX: number | null = null;
  let currentYearY: number | null = null;
  if (currentDaYunIdx >= 0) {
    const curDY = daYunAvgs[currentDaYunIdx];
    const startPt = gPoints[currentDaYunIdx];
    const nextPt = currentDaYunIdx === n - 1 ? endPoint : gPoints[currentDaYunIdx + 1];
    const frac = Math.min(1, (currentYear - curDY.startYear) / (curDY.endYear - curDY.startYear));
    currentYearX = startPt.x + frac * (nextPt.x - startPt.x);
    currentYearY = startPt.y + frac * (nextPt.y - startPt.y);
  }

  // 시각 하이라이트 X 범위 — 마지막 대운은 endPoint.x까지, 그 외는 다음 점까지
  const rectX1 = selectedIdx === 0 ? PX : gPoints[selectedIdx].x;
  const rectX2 = selectedIdx === n - 1 ? endPoint.x : gPoints[selectedIdx + 1].x;

  return (
    <section className="db-section" aria-label="인생 흐름">
      <h3 className="db-section-title">인생 흐름(대운)</h3>

      <div className="db-dayun-graph-wrap">
        <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" style={{ display: "block" }} aria-hidden="true">
          {/* 격자 */}
          {[1, 2, 3, 4, 5].map(star => {
            const y = PY + (H - PY * 2) * (1 - (star - 1) / 4);
            return <line key={star} x1={PX} x2={W - PX} y1={y} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
          })}

          {/* 선택 대운 기간 면 하이라이트 — fill + 좌우 선 (rectX1/X2는 그래프 경계에 클램핑됨) */}
          <rect
            x={rectX1} y={PY - 12}
            width={rectX2 - rectX1} height={H - PY * 2 + 24}
            fill="rgba(234,203,138,0.10)"
          />
          <line x1={rectX1} x2={rectX1} y1={PY - 12} y2={H - PY + 12}
            stroke="rgba(234,203,138,0.25)" strokeWidth="1" />
          <line x1={rectX2} x2={rectX2} y1={PY - 12} y2={H - PY + 12}
            stroke="rgba(234,203,138,0.25)" strokeWidth="1" />

          {/* 베지어 곡선 */}
          <path d={pathD} fill="none"
            stroke="rgba(184,206,224,0.5)" strokeWidth="1.5" />

          {/* 현재 연도 마커 (그래프만, 클릭 없음) */}
          {currentYearX !== null && currentYearY !== null && (
            <>
              <line
                x1={currentYearX} x2={currentYearX}
                y1={PY} y2={currentYearY}
                stroke="rgba(234,203,138,0.85)" strokeWidth="1.5"
              />
              <circle cx={currentYearX} cy={currentYearY + 2} r={3} fill="#EACB8A" />
              <text x={currentYearX} y={PY - 3}
                fontSize="10" textAnchor="middle" fill="#EACB8A" fontWeight="700">
                지금 {currentAge}세
              </text>
            </>
          )}

          {/* 대운 클릭 영역 */}
          {gPoints.map((_, i) => {
            const x1 = i === 0 ? PX - 8 : gPoints[i].x;
            const x2 = i === n - 1 ? endPoint.x + 8 : gPoints[i + 1].x;
            return (
              <rect key={i}
                x={x1} y={4} width={x2 - x1} height={H}
                fill="transparent" style={{ cursor: "pointer" }}
                onClick={() => setSelectedIdx(i)}
              />
            );
          })}

          {/* 꼭짓점 점 */}
          {gPoints.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y}
              r={i === selectedIdx ? 4.5 : 3}
              fill={i === selectedIdx ? "#EACB8A" : "rgba(184,206,224,0.55)"}
              style={{ pointerEvents: "none" }}
            />
          ))}
          {/* 마지막 대운 끝년도 점 */}
          <circle cx={endPoint.x} cy={endPoint.y}
            r={3} fill="rgba(184,206,224,0.55)"
            style={{ pointerEvents: "none" }}
          />

          {/* X축 연도 레이블 */}
          {daYunAvgs.map((d, i) => (
            <text key={i} x={gPoints[i].x} y={H + 16}
              fontSize="9.5" textAnchor="middle"
              fill={i === selectedIdx ? "rgba(234,203,138,0.95)" : "rgba(184,206,224,0.6)"}
              fontWeight={i === selectedIdx ? "700" : "500"}
              style={{ pointerEvents: "none" }}
            >
              {d.startYear}
            </text>
          ))}
          {/* 마지막 대운 끝년도 레이블 */}
          <text x={endPoint.x} y={H + 16}
            fontSize="9.5" textAnchor="middle"
            fill="rgba(184,206,224,0.6)" fontWeight="500"
            style={{ pointerEvents: "none" }}
          >
            {daYunAvgs[n - 1].endYear}
          </text>
        </svg>
      </div>

      {/* 대운 카드 */}
      <div className="db-dayun-card">
        <div className="db-dayun-year-nav">
          <span className="db-dayun-card-year">
            {selected.startYear} ~ {selected.endYear}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, color: "var(--saju-gold)", fontWeight: 700 }}>
              {ganZhiKor(selected.dy.ganZhi)}
            </span>
            <span className="db-dayun-stars">{starsDisplay(selected.stars)}</span>
          </span>
        </div>
        <div className="db-dayun-card-text" style={{ position: "relative" }}>
          {fortuneError ? (
            <span className="db-dayun-fortune-loading">
              서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.
            </span>
          ) : (
            <span style={{ opacity: fortuneLoading ? 0.3 : 1, transition: "opacity 0.2s" }}>
              {fortuneText ?? ""}
            </span>
          )}
          {fortuneLoading && !fortuneError && (
            <span className="db-dayun-fortune-loading" style={{
              position: "absolute", top: 0, left: 0, color: "#ffffff",
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(8,22,44,0.88)",
              border: "1px solid rgba(102,178,214,0.2)",
              borderRadius: "8px",
              padding: "4px 10px",
              backdropFilter: "blur(4px)",
            }}>
              <WhirlLoader />운세 풀이 중...
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

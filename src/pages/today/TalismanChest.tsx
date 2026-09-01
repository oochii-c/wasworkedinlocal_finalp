import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSaju } from "../../state/SajuContext";
import { getDailyTalisman, type DailyTalisman } from "../../services/sajuApi";
import { type DailyInfo } from "../../saju";
import WhirlLoader from "../../components/WhirlLoader";

interface Props {
  daily: DailyInfo;
}

// 오늘의 부적 — GPT-5 Image가 오늘 일진 신호로 부적 이미지를 통째로 생성한다.
export default function TalismanChest({ daily }: Props) {
  const { chart, readCache, writeCache } = useSaju();
  const key = `talisman:${(chart?.baZi ?? []).join("")}:${daily.date}`;

  const [data, setData] = useState<DailyTalisman | null>(() => readCache<DailyTalisman>(key) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const run = useCallback(async () => {
    const cached = readCache<DailyTalisman>(key);
    if (cached) { setData(cached); return; }
    setLoading(true);
    setError("");
    try {
      const res = await getDailyTalisman({
        dayGan: daily.dayGan,
        dayGanZhi: daily.dayGanZhi,
        band: daily.dayStrength.band,
        jiShen: daily.jiShen.map((t) => t.ko),
        xiongSha: daily.xiongSha.map((t) => t.ko),
        yi: daily.yi.map((t) => t.ko),
        ji: daily.ji.map((t) => t.ko),
        positionCai: daily.positionCai,
      });
      writeCache(key, res);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "부적 생성 실패");
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (open && !data && !loading) run();
  }, [open, data, loading, run]);

  const handleDownload = () => {
    if (!data) return;
    const a = document.createElement("a");
    a.href = data.image;
    a.download = `${data.caption || data.title || "오늘의부적"}.png`;
    a.click();
  };

  return (
    <>
      <button type="button" className="talisman-chest-btn" onClick={() => setOpen(true)}>
        <span className="talisman-chest-icon" aria-hidden="true">🎁</span>
        오늘의 부적 뽑기
      </button>

      {open &&
        createPortal(
          <div className="talisman-modal-backdrop" onClick={() => setOpen(false)}>
            <div className="talisman-modal" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="talisman-modal-close" onClick={() => setOpen(false)} aria-label="닫기">
                ✕
              </button>

              {loading ? (
                <p className="db-ai-body" style={{ color: "#ffffff" }}>
                  <WhirlLoader />부적을 짓는 중...
                </p>
              ) : data ? (
                <>
                  <span className="talisman-category">{data.title}</span>
                  <img className="talisman-card" src={data.image} alt={`오늘의 부적: ${data.title}`} />
                  <p className="db-ai-body talisman-blessing">{data.blessing}</p>
                  <button type="button" className="talisman-download-btn" onClick={handleDownload} aria-label="부적 다운로드">
                    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
                      <path d="M11 3h2v9.2l3.1-3.1 1.4 1.4L12 15l-5.5-4.5 1.4-1.4L11 12.2z" />
                      <rect x="5" y="18" width="14" height="2" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <p className="db-ai-body">부적을 짓지 못했어요. {error}</p>
                  <button type="button" className="db-ai-more" onClick={run}>
                    ↻ 다시 시도
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

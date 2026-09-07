import { type DailyFortune } from "../../services/sajuApi";
import { type DailyInfo } from "../../saju";
import WhirlLoader from "../../components/WhirlLoader";
import TalismanChest from "./TalismanChest";

interface Props {
  data: DailyFortune | null;
  loading: boolean;
  onRetry?: () => void;
  daily: DailyInfo;
}

// 오늘의 기운 + 총평 + 부적 — 한 박스 안에 이어서 보여준다.
export default function DailyAiCard({ data, loading, onRetry, daily }: Props) {
  return (
    <section className="db-section" aria-label="오늘 운세">
      <h3 className="db-section-title">🔮 오늘의 운세</h3>
      <div className="db-ai-box">
        {loading ? (
          <p className="db-ai-body" style={{ color: "#ffffff" }}>
            <WhirlLoader />풀이를 불러오는 중...
          </p>
        ) : data ? (
          <>
            <p className="db-ai-subhead">오늘의 기운</p>
            <p className="db-ai-body">{data.energy || "오늘의 기운을 불러오지 못했어요."}</p>
            <p className="db-ai-subhead db-ai-subhead-gap">오늘의 총평</p>
            <p className="db-ai-body">{data.text}</p>
            <TalismanChest daily={daily} />
          </>
        ) : (
          <>
            <p className="db-ai-body">풀이를 불러오지 못했어요.</p>
            {onRetry && (
              <button type="button" className="db-ai-more" onClick={onRetry} aria-label="풀이 다시 시도">
                ↻ 다시 시도
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

import { type DailyFortune } from "../../services/sajuApi";
import WhirlLoader from "../../components/WhirlLoader";

interface Props {
  data: DailyFortune | null;
  loading: boolean;
  onRetry?: () => void;
}

// 오늘의 총평 — dashboard AiStories 와 동일한 .db-ai-box 구조/크기
export default function DailyAiCard({ data, loading, onRetry }: Props) {
  return (
    <section className="db-section" aria-label="오늘의 총평">
      <h3 className="db-section-title">🔮 오늘의 총평</h3>
      <div className="db-ai-box">
        {loading ? (
          <p className="db-ai-body" style={{ color: "#ffffff" }}>
            <WhirlLoader />풀이를 불러오는 중...
          </p>
        ) : data ? (
          <p className="db-ai-body">{data.text}</p>
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

import { useState } from "react";
import { type Story } from "./types";

interface Props {
  stories: Story[] | null;
  loading?: boolean;
  onRetry?: () => void;
}

export default function AiStories({ stories, loading, onRetry }: Props) {
  const [expanded, setExpanded] = useState(false);
  const first = stories?.[0];
  const rest = stories?.slice(1) ?? [];

  if (!first) {
    return (
      <section className="db-section" aria-label="AI 총운 풀이">
        <h3 className="db-section-title">🔮 AI 총운 풀이</h3>
        <div className="db-ai-box">
          {loading ? (
            <p className="db-ai-body">풀이를 불러오는 중...</p>
          ) : (
            <>
              <p className="db-ai-body">풀이를 불러오지 못했어요. 원국은 그대로 있어요.</p>
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

  return (
    <section className="db-section" aria-label="AI 총운 풀이">
      <h3 className="db-section-title">🔮 AI 총운 풀이</h3>
      <div className="db-ai-box">
        <p className="db-ai-headline">"{first.title}"</p>
        <p className="db-ai-body">{first.body}</p>

        {rest.length > 0 && !expanded && (
          <button
            type="button"
            className="db-ai-more"
            onClick={() => setExpanded(true)}
            aria-label="전체 풀이 펼치기"
          >
            ＋ 더보기 (전체 풀이)
          </button>
        )}

        {expanded && rest.map((s, i) => (
          <div key={i} className="db-ai-extra">
            <p className="db-ai-headline">"{s.title}"</p>
            <p className="db-ai-body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

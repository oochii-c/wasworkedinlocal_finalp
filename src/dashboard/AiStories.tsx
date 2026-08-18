import { useState } from "react";
import { type Story } from "./types";

interface Props {
  stories: Story[];
}

export default function AiStories({ stories }: Props) {
  const [expanded, setExpanded] = useState(false);
  const first = stories[0];
  const rest = stories.slice(1);

  if (!first) return null;

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

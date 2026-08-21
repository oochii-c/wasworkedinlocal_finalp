import { useEffect, useState } from "react";
import "./topics.css";
import { getThemes, type ThemeSummary } from "../../services/sajuApi";
import { useSaju } from "../../state/SajuContext";

// 주제 key → 아이콘. 백엔드 THEME_DEFS 순서와 짝. 항목 추가 시 여기에 아이콘만 더하면 됨.
export const THEME_ICON: Record<string, string> = {
  love: "💕",
  wealth: "💰",
  health: "🌿",
  business: "🪸",
  study: "📖",
  relations: "🤝",
};

export function starRow(stars: number): string {
  const n = Math.min(5, Math.max(0, stars));
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export default function TopicList() {
  const { chart, inputs, openTheme, readCache, writeCache } = useSaju();
  const key = chart ? `themes:${chart.baZi.join("")}` : "";
  const [themes, setThemes] = useState<ThemeSummary[] | null>(() => (key ? readCache<ThemeSummary[]>(key) ?? null : null));
  const [loading, setLoading] = useState(!themes);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chart) return;
    const cached = readCache<ThemeSummary[]>(key);
    if (cached) { setThemes(cached); setLoading(false); return; }

    let alive = true;
    setLoading(true);
    setError("");
    getThemes({ name: inputs?.name ?? "", gender: inputs?.gender ?? "male", chart })
      .then((t) => { if (alive) { writeCache(key, t); setThemes(t); } })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "주제 풀이 생성 실패"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // 원국(key) 바뀌면 재요청, 같으면 캐시 재사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const scrollTo = (key: string) => {
    document.getElementById(`tp-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="tp-wrap">
      {/* 상단 가로 스크롤 탭 */}
      {themes && (
        <nav className="tp-tabs" aria-label="주제 탭">
          {themes.map((t) => (
            <button key={t.key} type="button" className="tp-tab" onClick={() => scrollTo(t.key)}>
              <span aria-hidden="true">{THEME_ICON[t.key] ?? "🔹"}</span> {t.label}
            </button>
          ))}
        </nav>
      )}

      {loading && <p className="tp-status">용왕님이 주제별 풀이를 살피는 중…</p>}
      {error && <p className="tp-status tp-status-err">{error}</p>}

      {/* 주제 카드 세로 나열 */}
      {themes?.map((t) => (
        <section key={t.key} id={`tp-${t.key}`} className="db-section tp-card" aria-label={`${t.label} 리딩`}>
          <div className="tp-card-head">
            <span className="tp-card-ico" aria-hidden="true">{THEME_ICON[t.key] ?? "🔹"}</span>
            <span className="tp-card-title">{t.label}</span>
            <span className="tp-card-stars" aria-label={`별점 ${t.stars}점`}>{starRow(t.stars)}</span>
          </div>
          <p className="tp-card-summary">{t.summary}</p>
          <button type="button" className="tp-card-more" onClick={() => openTheme(t.key)}>
            자세히 보기 →
          </button>
        </section>
      ))}
    </div>
  );
}

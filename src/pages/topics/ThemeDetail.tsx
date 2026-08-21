import { useEffect, useState } from "react";
import "./topics.css";
import { useSaju } from "../../state/SajuContext";
import { getThemeDetail, type ThemeSummary, type ThemeSection } from "../../services/sajuApi";
import { THEME_ICON, starRow } from "./TopicList";

/* 주제 상세 화면 — 리스트에서 "자세히 보기"로 진입.
   요약(별점·한줄)은 캐시 재사용. 깊은 풀이는 열 때 on-demand fetch 후 캐시. */
export default function ThemeDetail() {
  const { chart, inputs, selectedTheme, navigate, readCache, writeCache } = useSaju();
  const sig = chart ? chart.baZi.join("") : "";

  const themes = sig ? readCache<ThemeSummary[]>(`themes:${sig}`) : undefined;
  const theme = themes?.find((t) => t.key === selectedTheme);

  const detailKey = selectedTheme ? `detail:${selectedTheme}:${sig}` : "";
  const [sections, setSections] = useState<ThemeSection[] | null>(
    () => (detailKey ? readCache<ThemeSection[]>(detailKey) ?? null : null),
  );
  const [loading, setLoading] = useState(!sections);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chart || !selectedTheme) return;
    const cached = readCache<ThemeSection[]>(detailKey);
    if (cached) { setSections(cached); setLoading(false); return; }

    let alive = true;
    setLoading(true);
    setError("");
    getThemeDetail({ name: inputs?.name ?? "", gender: inputs?.gender ?? "male", chart, theme: selectedTheme })
      .then((s) => { if (alive) { writeCache(detailKey, s); setSections(s); } })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "상세 풀이 생성 실패"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // 주제/원국(detailKey) 바뀌면 재요청, 같으면 캐시 재사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailKey]);

  return (
    <div className="tp-wrap">
      <button type="button" className="tp-back" onClick={() => navigate("topics")}>
        ← 주제 목록
      </button>

      {!theme ? (
        <p className="tp-status tp-status-err">주제를 찾을 수 없어요. 목록에서 다시 선택해 주세요.</p>
      ) : (
        <>
          <section className="db-section tp-detail-head" aria-label={`${theme.label} 상세`}>
            <div className="tp-card-head">
              <span className="tp-card-ico" aria-hidden="true">{THEME_ICON[theme.key] ?? "🔹"}</span>
              <span className="tp-card-title">{theme.label}</span>
              <span className="tp-card-stars" aria-label={`별점 ${theme.stars}점`}>{starRow(theme.stars)}</span>
            </div>
            <p className="tp-card-summary">{theme.summary}</p>
          </section>

          {loading && <p className="tp-status">용왕님이 {theme.label} 풀이를 깊이 살피는 중…</p>}
          {error && <p className="tp-status tp-status-err">{error}</p>}

          {sections?.map((s, i) => (
            <section key={i} className="db-section" aria-label={s.heading}>
              <h3 className="db-section-title">{s.heading}</h3>
              <p className="tp-card-summary" style={{ marginBottom: 0 }}>{s.body}</p>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

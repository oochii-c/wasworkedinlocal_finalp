import { useEffect, useRef, useState } from "react";
import "./topics.css";
import { getThemes, getThemeDetail, type ThemeSummary } from "../../services/sajuApi";
import { useSaju } from "../../state/SajuContext";
import { computeThemeScores, type ThemeKey } from "./themeScoring";
import { scoreColor } from "../yearFortune/saju/insights";
import WhirlLoader from "../../components/WhirlLoader";

import iconLove from "../../assets/icons/06_compatibility.svg";
import iconWealth from "../../assets/icons/04_wealth.svg";
import iconHealth from "../../assets/icons/02_todays-fortune-core.svg";
import iconBusiness from "../../assets/icons/03_five-elements.svg";
import iconStudy from "../../assets/icons/08_deep-analysis.svg";
import iconRelations from "../../assets/icons/05_fate-path.svg";

// 주제 key → 아이콘(SVG). 올해 풀이(DomainStars)와 같은 세트를 쓴다.
const THEME_ICON: Record<string, string> = {
  love: iconLove,
  wealth: iconWealth,
  health: iconHealth,
  business: iconBusiness,
  study: iconStudy,
  relations: iconRelations,
};

// Figma 내보내기라 potrace 아이콘보다 커 보여 축소 보정하는 key.
const FIG_ICON = new Set(["health", "relations"]);

// 요약이 없을 때(로딩·실패) 자리만 잡아둘 골격. 백엔드 THEME_DEFS와 key·순서·라벨을 맞춘다.
const THEME_SKELETON = [
  { key: "love", label: "애정" },
  { key: "wealth", label: "재물" },
  { key: "health", label: "건강" },
  { key: "business", label: "사업" },
  { key: "study", label: "학업" },
  { key: "relations", label: "인간관계" },
];

function starRow(stars: number): string {
  const n = Math.min(5, Math.max(0, stars));
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export default function TopicList() {
  const { chart, inputs, readCache, writeCache } = useSaju();
  // 별점은 LLM이 아니라 원국 십성 분포로 결정론적으로 매긴다.
  const themeScores = chart ? computeThemeScores(chart, inputs?.gender ?? "male") : null;
  const starOf = (k: string) => themeScores?.[k as ThemeKey] ?? 3;
  const key = chart ? `themes:${chart.baZi.join("")}:${inputs?.gender ?? "?"}` : "";
  const [themes, setThemes] = useState<ThemeSummary[] | null>(() => (key ? readCache<ThemeSummary[]>(key) ?? null : null));
  const [loading, setLoading] = useState(!themes);
  const [error, setError] = useState("");

  // 주제 상세: 펼친 주제 key + 주제별 상세 텍스트/로딩/에러
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [detailErr, setDetailErr] = useState<Record<string, string>>({});
  const started = useRef<Set<string>>(new Set()); // 중복 요청 방지

  const detailKey = (k: string) => `themedetail:${chart?.baZi.join("") ?? ""}:${inputs?.gender ?? "?"}:${k}`;

  // 원국(key) 바뀌면 상세 상태 초기화
  useEffect(() => {
    started.current = new Set();
    setDetails({});
    setDetailLoading({});
    setDetailErr({});
    setOpenKey(null);
  }, [key]);

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

  // 주제별 상세 풀이 요청(주제당 1회). 캐시 있으면 즉시 사용.
  const fetchDetail = (t: ThemeSummary) => {
    if (!chart || started.current.has(t.key)) return;
    started.current.add(t.key);

    const cached = readCache<string>(detailKey(t.key));
    if (cached) { setDetails((m) => ({ ...m, [t.key]: cached })); return; }

    setDetailLoading((m) => ({ ...m, [t.key]: true }));
    setDetailErr((m) => ({ ...m, [t.key]: "" }));
    getThemeDetail({ name: inputs?.name ?? "", gender: inputs?.gender ?? "male", chart, key: t.key, label: t.label })
      .then((text) => { writeCache(detailKey(t.key), text); setDetails((m) => ({ ...m, [t.key]: text })); })
      .catch((e) => setDetailErr((m) => ({ ...m, [t.key]: e instanceof Error ? e.message : "주제 상세 생성 실패" })))
      .finally(() => setDetailLoading((m) => ({ ...m, [t.key]: false })));
  };

  // 요약이 뜨면 6개 상세를 병렬로 미리 당겨온다(자세히 보기 즉시 표시용).
  useEffect(() => {
    if (!themes || !chart) return;
    themes.forEach((t) => fetchDetail(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themes, chart]);

  const toggleDetail = (t: ThemeSummary) => {
    setOpenKey((cur) => (cur === t.key ? null : t.key));
    fetchDetail(t); // 프리페치 실패/미완이면 여기서 보강(started 가드로 중복 없음)
  };

  return (
    <div className="tp-wrap">
      {loading && <p className="tp-status" style={{ color: "#ffffff" }}><WhirlLoader />용왕님이 주제별 풀이를 살피는 중…</p>}
      {error && <p className="tp-status tp-status-err">{error}</p>}

      {/* 요약을 못 받았어도 카드 골격은 띄운다 — 화면이 통째로 비지 않게 */}
      {!themes && THEME_SKELETON.map((t) => (
        <section key={t.key} className="db-section tp-card tp-card-empty" aria-label={`${t.label} 리딩`}>
          <div className="tp-card-head">
            <span
              className="tp-card-ico"
              aria-hidden="true"
              data-fig={FIG_ICON.has(t.key) ? "1" : undefined}
              style={{
                maskImage: `url(${THEME_ICON[t.key]})`,
                WebkitMaskImage: `url(${THEME_ICON[t.key]})`,
                backgroundColor: "#B8CEE0",
              }}
            />
            <span className="tp-card-title">{t.label}</span>
            <span className="tp-card-stars" aria-label={`별점 ${starOf(t.key)}점`}>{starRow(starOf(t.key))}</span>
          </div>
          <p className="tp-card-summary">{error ? "풀이를 불러오지 못했습니다." : "용왕님이 살피는 중…"}</p>
        </section>
      ))}

      {/* 주제 카드 세로 나열 */}
      {themes?.map((t) => {
        const open = openKey === t.key;
        return (
        <section key={t.key} id={`tp-${t.key}`} className="db-section tp-card" aria-label={`${t.label} 리딩`}>
          <div className="tp-card-head">
            <span
              className="tp-card-ico"
              aria-hidden="true"
              data-fig={FIG_ICON.has(t.key) ? "1" : undefined}
              style={{
                maskImage: `url(${THEME_ICON[t.key]})`,
                WebkitMaskImage: `url(${THEME_ICON[t.key]})`,
                backgroundColor: open ? scoreColor(starOf(t.key)) : "#B8CEE0",
              }}
            />
            <span className="tp-card-title">{t.label}</span>
            <span className="tp-card-stars" aria-label={`별점 ${starOf(t.key)}점`}>{starRow(starOf(t.key))}</span>
          </div>
          <p className="tp-card-summary">{t.summary}</p>

          {open && (
            <div className="tp-card-detail">
              {detailErr[t.key] ? (
                <p className="tp-status-err">{detailErr[t.key]}</p>
              ) : details[t.key] ? (
                // 상세는 도착했을 때만 표시(요약은 위에 이미 있음)
                <p>{details[t.key]}</p>
              ) : null}
              {detailLoading[t.key] && <span className="tp-detail-loading" style={{ color: "#ffffff" }}><WhirlLoader size={20} />용왕님이 더 깊이 살피는 중…</span>}
            </div>
          )}

          <button type="button" className="tp-card-more" onClick={() => toggleDetail(t)}>
            {open ? "접기" : "자세히 보기 →"}
          </button>
        </section>
        );
      })}
    </div>
  );
}

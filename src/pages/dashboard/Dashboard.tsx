import { useCallback, useEffect, useState } from "react";
import "./dashboard.css";
import CharacterCard from "./CharacterCard";
import OriginChart from "./OriginChart";
import ElementStar from "./ElementStar";
import TenGodRadar from "./TenGodRadar";
import ShenShaList from "./ShenShaList";
import AiStories from "./AiStories";
import DaYunFlow from "./DaYunFlow";
import BottomNav from "../../components/layout/BottomNav";
import TopicList from "../topics/TopicList";
import YearDetail from "../year";
import BubbleField from "../../components/effects/BubbleField";
import { useSaju } from "../../state/SajuContext";
import { getReading, type Story } from "../../services/sajuApi";

// 총운 풀이 — 원국 signature 키로 캐시. 같은 원국이면 재호출 X (탭·뒤로 넘어 유지)
function useReading() {
  const { chart, inputs, readCache, writeCache } = useSaju();
  const key = chart ? `stories:${chart.baZi.join("")}` : "";
  const [stories, setStories] = useState<Story[] | null>(() => (key ? readCache<Story[]>(key) ?? null : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchIt = useCallback(async () => {
    if (!chart) return;
    const cached = readCache<Story[]>(key);
    if (cached) { setStories(cached); return; }
    setLoading(true);
    setError("");
    try {
      const s = await getReading({ name: inputs?.name ?? "", gender: inputs?.gender ?? "male", chart });
      writeCache(key, s);
      setStories(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "풀이 생성 실패");
      setStories(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  return { stories, loading, error, retry: fetchIt };
}

export default function Dashboard() {
  const { chart, inputs, view, navigate } = useSaju();
  const { stories, loading, error, retry } = useReading();
  const [yearTarget, setYearTarget] = useState<number | null>(null);

  if (!chart) return null; // Router가 보장하지만 타입 가드

  return (
    <div className="db-page">
      <BubbleField />
      {/* 상단 바 */}
      <header className="db-topbar">
        <span className="db-logo">용왕님 말씀</span>
        <button type="button" className="db-back-btn" onClick={() => navigate("form")} aria-label="입력으로 돌아가기">
          ← 다시 입력
        </button>
      </header>

      <main className="db-main">
        {view === "topics" ? (
          <TopicList />
        ) : view === "year" && yearTarget ? (
          <YearDetail year={yearTarget} onBack={() => navigate("home")} />
        ) : (
          <>
            {/* 블록 1: 캐릭터 */}
            <CharacterCard
              chart={chart}
              name={inputs?.name ?? ""}
              gender={inputs?.gender ?? "male"}
              date={inputs?.date ?? { year: 0, month: 0, day: 0 }}
              time={inputs?.time ?? { hour: 0, minute: 0 }}
              timeUnknown={inputs?.timeUnknown ?? false}
            />

            {/* 블록 2: 원국 8글자 */}
            <OriginChart pillars={chart.pillars} />

            {/* 블록 3+4: 오행 & 십성 (2열 나란히) */}
            <div className="db-row2">
              <ElementStar wuXingCount={chart.wuXingCount} />
              <TenGodRadar shiShenCount={chart.shiShenCount} />
            </div>

            {/* 블록 5: 신살 */}
            <ShenShaList shenSha={chart.shenSha} />

            {/* 블록 6: AI 총운 */}
            <AiStories stories={stories} loading={loading} onRetry={error ? retry : undefined} />

            {/* 블록 7: 대운 */}
            <DaYunFlow
              daYun={chart.daYun}
              seWun={chart.seWun}
              currentSeWun={chart.currentSeWun}
              birthYear={inputs?.date.year ?? 0}
              dayGan={chart.dayGan}
              onOpenYear={(y) => { setYearTarget(y); navigate("year"); }}
            />
          </>
        )}
      </main>

      {/* 하단 네비 */}
      <BottomNav
        active={view === "topics" ? "topics" : "home"}
        onSelect={(id) => navigate(id === "topics" ? "topics" : "home")}
      />
    </div>
  );
}

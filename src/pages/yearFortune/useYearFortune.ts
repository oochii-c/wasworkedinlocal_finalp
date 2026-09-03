import { useEffect, useRef, useState } from "react";
import { getYearFortune, type YearFortuneResult } from "../../services/sajuApi";
import {
  CHEON_GAN_HANJA,
  JI_JI_HANJA,
  GAN_TO_OHAENG,
  ohaengOfHanjaGan,
  getOhaengRelation,
  getYearGanZhi,
  type ElementRelation,
} from "./saju/ganzhi";
import { computeDomainScores, computeMonthlyScores, GRID_DOMAINS } from "./saju/scoring";
import { getMonthInGanZhi } from "./saju/monthGanzhi";
import { SajuExtended } from "./saju/types";

/* 이 화면의 AI 해설을 실제 백엔드(POST /api/year-fortune)에서 받아온다.
   한 번의 호출로 총평(text)·요약(summary)·영역 6개(domains)·월별 12개(months)를 받는다.
   대운(DaYunFlow)과 같은 방식으로 ref 캐시(일간-연도 키) + 요청 취소 플래그를 둔다. */

// 세운 천간(오행) → 일간(오행) 관계를 백엔드 프롬프트가 기대하는 한글 라벨로.
const REL_LABEL: Record<ElementRelation, string> = {
  generates: "상생",
  same: "비화",
  controlled_by: "상성",
  generated_by: "설기",
  controls: "상극",
};

export interface YearFortuneState extends YearFortuneResult {
  loading: boolean;
  error: boolean;
}

const EMPTY: YearFortuneResult = { text: "", summary: "", domains: {}, months: [] };

export function useYearFortune(
  chart: SajuExtended | null,
  year: number,
  gender: string,
): YearFortuneState {
  const cache = useRef<Record<string, YearFortuneResult>>({});
  const [result, setResult] = useState<YearFortuneResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chart) return;

    const yearGz = getYearGanZhi(year);
    const ganZhi = `${CHEON_GAN_HANJA[yearGz.gan]}${JI_JI_HANJA[yearGz.ji]}`;
    const dayGan = chart.dayGan;
    const cacheKey = `${dayGan}-${year}-${gender}`;

    const cached = cache.current[cacheKey];
    if (cached) {
      setResult(cached);
      setLoading(false);
      setError(false);
      return;
    }

    const rel = REL_LABEL[getOhaengRelation(GAN_TO_OHAENG[yearGz.gan], ohaengOfHanjaGan(dayGan))];
    const domainScores = computeDomainScores(chart, year, gender);
    const stars = domainScores["총운"];
    const monthlyScores = computeMonthlyScores(chart, year);
    const monthly = monthlyScores.map((score, i) => {
      const gz = getMonthInGanZhi(year, i + 1);
      return { month: i + 1, ganZhi: `${gz.gan}${gz.ji}`, score };
    });

    setLoading(true);
    setError(false);
    let cancelled = false;

    getYearFortune({
      year,
      ganZhi,
      rel,
      dayGan,
      stars,
      wuXingCount: chart.wuXingCount,
      domainScores: Object.fromEntries(GRID_DOMAINS.map((d) => [d, domainScores[d]])),
      monthly,
    })
      .then((r) => {
        if (cancelled) return;
        cache.current[cacheKey] = r;
        setResult(r);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, year, gender]);

  return { ...result, loading, error };
}

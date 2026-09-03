import { useEffect, useRef, useState } from "react";
import { getYearFortune } from "../../services/sajuApi";
import {
  CHEON_GAN_HANJA,
  JI_JI_HANJA,
  GAN_TO_OHAENG,
  getOhaengRelation,
  getYearGanZhi,
  type ElementRelation,
} from "./saju/ganzhi";
import { computeDomainScores } from "./saju/mock/scoring";
import { SajuExtended } from "./saju/types";

/* 이 화면의 "AI 총평"을 실제 백엔드(POST /api/year-fortune)에서 받아온다.
   yearFortune 모듈은 한글 간지·한글 오행 키를 쓰지만 백엔드 프롬프트는
   한자 일간/간지를 기대하므로 여기서 변환한다. 대운(DaYunFlow)과 같은
   방식으로 ref 캐시(일간-연도 키) + 요청 취소 플래그를 둔다. */

// 세운 천간(오행) → 일간(오행) 관계를 백엔드 프롬프트가 기대하는 한글 라벨로.
// scoring.ts 의 RELATION_SCORE 와 같은 방향(a=세운, b=일간)·같은 등급을 쓴다.
const REL_LABEL: Record<ElementRelation, string> = {
  generates: "상생",     // 세운이 일간을 생함
  same: "비화",
  controlled_by: "상성", // 일간이 세운을 극함
  generated_by: "설기",  // 일간이 세운에 기운을 내어줌
  controls: "상극",      // 세운이 일간을 극함
};

export interface YearFortuneState {
  text: string | null;
  loading: boolean;
  error: boolean;
}

export function useYearFortune(chart: SajuExtended, year: number): YearFortuneState {
  const cache = useRef<Record<string, string>>({});
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const yearGz = getYearGanZhi(year);
    const ganZhi = `${CHEON_GAN_HANJA[yearGz.gan]}${JI_JI_HANJA[yearGz.ji]}`;
    const dayGan = CHEON_GAN_HANJA[chart.dayMaster];
    const cacheKey = `${dayGan}-${year}`;

    if (cache.current[cacheKey]) {
      setText(cache.current[cacheKey]);
      setLoading(false);
      setError(false);
      return;
    }

    const rel = REL_LABEL[
      getOhaengRelation(GAN_TO_OHAENG[yearGz.gan], GAN_TO_OHAENG[chart.dayMaster])
    ];
    const stars = computeDomainScores(chart, year)["총운"];

    setLoading(true);
    setError(false);
    let cancelled = false;

    getYearFortune({ year, ganZhi, rel, dayGan, stars, wuXingCount: chart.ohaeng })
      .then((t) => {
        if (cancelled) return;
        cache.current[cacheKey] = t;
        setText(t);
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
  }, [chart, year]);

  return { text, loading, error };
}

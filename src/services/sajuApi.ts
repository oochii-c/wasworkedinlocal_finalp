// 사주 AI 풀이 API 통신 (백엔드 /api/reading 캡슐화)
import { type SajuExtended } from "../saju";

// AI 총운 풀이 스토리 (서버 /api/reading 응답 항목)
export interface Story {
  title: string;
  body: string;
}

export interface ReadingRequest {
  name: string;
  gender: string;
  chart: SajuExtended;
}

// 원국으로 AI 총운 풀이 요청. 실패 시 throw.
export async function getReading(req: ReadingRequest): Promise<Story[]> {
  const res = await fetch("/api/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "풀이 생성 실패");
  return data.stories as Story[];
}

// 주제별 리딩 요약 항목 (서버 /api/themes 응답)
// 별점은 서버가 주지 않는다 — 클라에서 원국 십성으로 결정론 산출(themeScoring.ts).
export interface ThemeSummary {
  key: string;
  label: string;
  summary: string; // 한 줄
}

// 원국으로 주제별(애정·재물·건강·사업·학업·인간관계) 요약 요청. 실패 시 throw.
export async function getThemes(req: ReadingRequest): Promise<ThemeSummary[]> {
  const res = await fetch("/api/themes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "주제 풀이 생성 실패");
  return data.themes as ThemeSummary[];
}

// 대운(10년 단위) AI 풀이 요청. 실패 시 throw.
export async function getDaYunFortune(params: {
  dayGan: string;
  ganZhi: string;
  startYear: number;
  endYear: number;
  rel: string;
  stars: number;
  wuXingCount: Record<string, number>;
}): Promise<string> {
  const res = await fetch("/api/dayun-fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "대운 풀이 생성 실패");
  return data.text as string;
}

// 특정 연도 세운(歲運) AI 풀이 요청. 실패 시 throw.
// 한 번 호출로 긴 총평(text) · 요약(summary) · 영역 6개(domains) · 월별 12개(months)를 받는다.
export interface YearFortuneResult {
  text: string;
  summary: string;
  domains: Record<string, string>;
  months: string[];
}

export async function getYearFortune(params: {
  year: number;
  ganZhi: string;      // 세운 간지 한자 2글자 (예: "丙午")
  rel: string;         // 세운 천간 ↔ 일간 관계 라벨 (상생·비화·상성·설기·상극)
  dayGan: string;      // 일간 한자 (예: "庚")
  stars: number;       // 1~5
  wuXingCount: Record<string, number>;
  domainScores: Record<string, number>;                        // 6영역 점수 (총운·애정·…)
  monthly: { month: number; ganZhi: string; score: number }[]; // 12개월 간지(한글)·점수
}): Promise<YearFortuneResult> {
  const res = await fetch("/api/year-fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "연도 운세 생성 실패");
  return {
    text: (data.text as string) ?? "",
    summary: (data.summary as string) ?? "",
    domains: data.domains && typeof data.domains === "object" ? (data.domains as Record<string, string>) : {},
    months: Array.isArray(data.months) ? (data.months as string[]) : [],
  };
}

// 특정 주제 하나의 상세 풀이 요청. 실패 시 throw.
export async function getThemeDetail(
  req: ReadingRequest & { key: string; label: string }
): Promise<string> {
  const res = await fetch("/api/theme-detail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "주제 상세 생성 실패");
  return data.text as string;
}

// 오늘의 부적 AI 생성 (서버 /api/daily-talisman, GPT-5 Image)
export interface DailyTalisman {
  image: string;    // data:image/png;base64,... — 생성된 부적 이미지
  title: string;    // 부적 제목
  caption: string;  // 하단 캡션 (부적 이름)
  blessing: string; // 오늘 하루 축복 한 문장
}

export interface DailyTalismanRequest {
  dayGan: string;
  dayGanZhi: string;
  band: string;
  jiShen: string[];
  xiongSha: string[];
  yi: string[];
  ji: string[];
  positionCai: string;
}

// 오늘의 부적 요청. 실패 시 throw.
export async function getDailyTalisman(req: DailyTalismanRequest): Promise<DailyTalisman> {
  const res = await fetch("/api/daily-talisman", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "오늘의 부적 생성 실패");
  return {
    image: data.image as string,
    title: data.title as string,
    caption: (data.caption as string) ?? "",
    blessing: data.blessing as string,
  };
}

// 오늘 하루 운세 AI 풀이 (서버 /api/daily-fortune)
export interface DailyFortune {
  energy: string; // "오늘의 기운" 2~3문장 (건제·십이신·충·신살·방위 종합)
  text: string;   // "오늘의 총평" 3문장 (일간 기준 조언)
  src: string;    // 핵심 근거 한 줄 (없으면 "")
}

export interface DailyFortuneRequest {
  dayGan: string;         // 일간(나)
  dayGanZhi: string;      // 오늘 일진 간지
  monthGanZhi: string;    // 이번달 월운
  yearGanZhi: string;     // 올해 세운
  rel: string;            // 일진 천간 ↔ 일간 관계 (seWunScore.rel)
  stars: number;          // 1~5
  jianChu: string;        // 건제12신 (우리말)
  tianShen: string;       // 십이신 (우리말)
  tianShenLuck: string;   // "길일" | "흉일" | ""
  jiShen: string[];       // 길신 (우리말)
  xiongSha: string[];     // 흉살 (우리말)
  yi: string[];           // 오늘 하기 좋은 일 (우리말)
  ji: string[];           // 오늘 꺼릴 일 (우리말)
  chong: string;          // 충 설명 (우리말 한 줄)
  positionCai: string;    // 재물 방위 (우리말)
  positionXi: string;     // 희신 방위 (우리말)
  shenSha: string[];      // 사주 원국 신살 이름
}

// 오늘의 운세 요청. 실패 시 throw.
export async function getDailyFortune(req: DailyFortuneRequest): Promise<DailyFortune> {
  const res = await fetch("/api/daily-fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "오늘의 운세 생성 실패");
  return {
    energy: (data.energy as string) ?? "",
    text: data.text as string,
    src: (data.src as string) ?? "",
  };
}

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
export interface ThemeSummary {
  key: string;
  label: string;
  stars: number;   // 1~5
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

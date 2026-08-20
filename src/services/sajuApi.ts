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

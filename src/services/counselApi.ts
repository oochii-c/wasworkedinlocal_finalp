import { type SajuExtended } from "../saju";
import { type CounselMessage } from "../pages/aiCounsel/types";

export interface CounselRequest {
  chart: SajuExtended;
  messages: CounselMessage[];
  personaId: string;
}

export interface CounselResponse {
  reply: string;
  src: string;
}

// 1층 클라이언트 방어: 명백한 프롬프트 인젝션 패턴 차단.
// 서버가 2·3층을 담당하지만, 이 층은 왕복 비용 없이 즉시 튕김.
const INJECT_RE = /ignore\s+(previous|above|instructions?)|system\s*:|<\s*system|역할\s*(바꿔|변경|무시)|assistant\s*:/i;

// null 반환 시 호출 측이 "캐릭터 페르소나 밖 질문" 안내 메시지를 보여줌
export function guardInput(text: string): string | null {
  return INJECT_RE.test(text) ? null : text;
}

// 실패 시 throw. 호출 측이 catch 해서 에러 메시지 표시.
export async function getCounsel(req: CounselRequest): Promise<CounselResponse> {
  const res = await fetch("/api/counsel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "상담 요청 실패");
  return data as CounselResponse;
}

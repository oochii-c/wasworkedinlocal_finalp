// 빌었던 소원 로컬 영속 — localStorage.
// 원국(baZi 8자)별로 목록 하나. 브라우저·기기 스코프.
// 저장소를 못 쓰는 환경(프라이빗 모드·차단 등)이면 모든 함수가 조용히 no-op —
// 호출부는 세션 메모리로만 동작한다.

export interface WishRecord {
  text: string;
  at: number;
}

const KEY = (sig: string) => `saju:wishes:${sig}`;
const MAX = 30;

/** 이 원국이 빌었던 소원을 최신순으로. 실패 시 []. */
export function loadWishes(sig: string): WishRecord[] {
  if (!sig) return [];
  try {
    const raw = localStorage.getItem(KEY(sig));
    if (!raw) return [];
    const list = JSON.parse(raw) as WishRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** 소원 하나를 앞에 추가하고 저장. 갱신된 목록을 돌려준다. */
export function addWish(sig: string, text: string): WishRecord[] {
  const next = [{ text, at: Date.now() }, ...loadWishes(sig)].slice(0, MAX);
  if (!sig) return next;
  try {
    localStorage.setItem(KEY(sig), JSON.stringify(next));
  } catch {
    /* 저장 실패해도 화면은 갱신된 목록으로 동작 */
  }
  return next;
}

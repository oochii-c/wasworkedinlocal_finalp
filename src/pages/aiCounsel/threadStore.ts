// 상담 대화 로컬 영속 — IndexedDB.
// 원국(baZi 8자) + 페르소나별로 스레드 하나를 저장한다. 브라우저·기기 스코프.
// IndexedDB를 못 쓰는 환경(프라이빗 모드·차단 등)이면 모든 함수가 조용히 no-op —
// 호출부는 세션 메모리로만 동작한다.
import type { CounselMessage } from "./types";

const DB_NAME = "saju-counsel";
const STORE = "threads";
const VERSION = 1;

interface ThreadRecord {
  messages: CounselMessage[];
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, VERSION);
      // 키는 out-of-line: `${sig}|${personaId}`
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

const keyOf = (sig: string, personaId: string) => `${sig}|${personaId}`;

function store(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

/** 이 원국의 모든 페르소나 스레드를 { personaId: messages } 로 로드. 실패 시 {}. */
export async function loadThreads(sig: string): Promise<Record<string, CounselMessage[]>> {
  const db = await openDb();
  const out: Record<string, CounselMessage[]> = {};
  if (!db || !sig) return out;
  return new Promise((resolve) => {
    try {
      // `${sig}|` 접두 범위만 훑는다.
      const range = IDBKeyRange.bound(`${sig}|`, `${sig}|￿`);
      const req = store(db, "readonly").openCursor(range);
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return resolve(out);
        const personaId = String(cur.key).slice(sig.length + 1);
        const rec = cur.value as ThreadRecord | undefined;
        if (rec?.messages?.length) out[personaId] = rec.messages;
        cur.continue();
      };
      req.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}

/** 한 페르소나 스레드를 저장(덮어쓰기). 실패 시 조용히 무시. */
export async function saveThread(
  sig: string,
  personaId: string,
  messages: CounselMessage[],
): Promise<void> {
  const db = await openDb();
  if (!db || !sig) return;
  return new Promise((resolve) => {
    try {
      const rec: ThreadRecord = { messages, updatedAt: Date.now() };
      const tx = store(db, "readwrite");
      tx.put(rec, keyOf(sig, personaId));
      tx.transaction.oncomplete = () => resolve();
      tx.transaction.onerror = () => resolve();
      tx.transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** 한 페르소나 스레드 삭제(대화 내역 지우기용). */
export async function clearThread(sig: string, personaId: string): Promise<void> {
  const db = await openDb();
  if (!db || !sig) return;
  return new Promise((resolve) => {
    try {
      const tx = store(db, "readwrite");
      tx.delete(keyOf(sig, personaId));
      tx.transaction.oncomplete = () => resolve();
      tx.transaction.onerror = () => resolve();
      tx.transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

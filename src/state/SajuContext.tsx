import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { computeSajuExtended, type SajuExtended } from "../saju";
import { type SajuDateValue, type SajuTimeValue } from "../components/form";

/* ============================================================
   SajuContext
   - inputs: 사용자 입력값 (localStorage 영속)
   - chart: 원국 (입력에서 재계산, 화면 이동 넘어 메모리 보존)
   - view: 현재 화면 (뒤로가기 = view 전환, chart 파괴 안 함)
   - AI 캐시: 원국 signature(baZi) 키로 풀이 재사용 (탭·뒤로 넘어 유지)
   ============================================================ */

export interface SajuInputs {
  name: string;
  gender: string;
  calendarBase: string;   // "solar" | "lunar"
  isLeapMonth: boolean;
  date: SajuDateValue;
  time: SajuTimeValue;
  timeUnknown: boolean;
}

export type SajuView = "form" | "home" | "topics" | "theme";

interface SajuCtx {
  inputs: SajuInputs | null;
  chart: SajuExtended | null;
  view: SajuView;
  selectedTheme: string | null;           // 상세 화면에서 보고 있는 주제 key
  commit: (inputs: SajuInputs) => void;   // 입력 → 계산 → 저장 → 홈. 실패 시 throw
  navigate: (view: SajuView) => void;     // chart 보존한 채 화면만 전환
  openTheme: (key: string) => void;       // 주제 상세 화면 진입
  readCache: <T>(key: string) => T | undefined;
  writeCache: (key: string, val: unknown) => void;
}

const INPUT_KEY = "saju:input";

function loadInputs(): SajuInputs | null {
  try {
    const raw = localStorage.getItem(INPUT_KEY);
    return raw ? (JSON.parse(raw) as SajuInputs) : null;
  } catch {
    return null;
  }
}
function saveInputs(v: SajuInputs) {
  try {
    localStorage.setItem(INPUT_KEY, JSON.stringify(v));
  } catch { /* 저장 실패 무시 (사파리 프라이빗 등) */ }
}
function toCalendarType(i: SajuInputs): string {
  return i.calendarBase === "solar" ? "solar" : i.isLeapMonth ? "leap-month" : "lunar";
}

const Ctx = createContext<SajuCtx | null>(null);

export function SajuProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<SajuInputs | null>(() => loadInputs());
  const [chart, setChart] = useState<SajuExtended | null>(null);
  const [view, setView] = useState<SajuView>("form");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const cache = useRef<Record<string, unknown>>({});

  const commit = (next: SajuInputs) => {
    // 실패(잘못된 날짜 등) 시 throw → 호출부(SajuForm)가 잡아 에러 표시
    const computed = computeSajuExtended({
      gender: next.gender,
      calendarType: toCalendarType(next),
      date: next.date,
      time: next.time,
      timeUnknown: next.timeUnknown,
    });
    setInputs(next);
    saveInputs(next);
    setChart(computed);
    setView("home");
  };

  const navigate = (v: SajuView) => setView(v);
  const openTheme = (key: string) => { setSelectedTheme(key); setView("theme"); };
  const readCache = <T,>(key: string): T | undefined => cache.current[key] as T | undefined;
  const writeCache = (key: string, val: unknown) => { cache.current[key] = val; };

  return (
    <Ctx.Provider value={{ inputs, chart, view, selectedTheme, commit, navigate, openTheme, readCache, writeCache }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSaju(): SajuCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSaju는 SajuProvider 안에서만 쓸 수 있습니다.");
  return c;
}

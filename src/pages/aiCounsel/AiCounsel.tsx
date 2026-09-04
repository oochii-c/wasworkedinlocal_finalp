import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import BottomNav from "../../components/layout/BottomNav";
import { getCounsel, guardInput } from "../../services/counselApi";
import { deriveIdentity } from "./identity";
import { PERSONAS, DEFAULT_PERSONA, getPersona, type Persona } from "./personas";
import "./aiCounsel.css";
import type { AiCounselProps, CounselMessage } from "./types";

// 정적 추천 질문
const SUGGESTED = [
  "올해 이직해도 될까요?",
  "제 연애운은 언제 들어오나요?",
  "재물운이 궁금합니다.",
  "건강에서 조심할 점이 있을까요?",
  "제 타고난 강점은 무엇인가요?",
  "올해 하반기 흐름은 어떤가요?",
  "직장에서 인정받을 수 있을까요?",
  "이사나 이동수가 있을까요?",
];

const welcomeOf = (p: Persona): CounselMessage => ({ role: "wang", text: p.welcome });

// 용왕 답변 타자기 효과 — 마운트 시 1회 한 글자씩. reduced-motion이면 즉시 전체 표시.
function TypewriterText({ text, onTick }: { text: string; onTick?: () => void }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 28);
    return () => window.clearInterval(id);
  }, [text]);

  // 타이핑되며 채팅이 아래로 따라가도록 (tick jank 방지 위해 즉시 스크롤)
  useEffect(() => {
    onTick?.();
  }, [count, onTick]);

  const done = count >= text.length;
  return (
    <>
      {text.slice(0, count)}
      {!done && <span className="ac-caret" aria-hidden="true" />}
    </>
  );
}

export default function AiCounsel({ chart, onSelect }: AiCounselProps) {
  // null = 채팅방 목록, 값 = 그 캐릭터의 방
  const [openId, setOpenId] = useState<string | null>(null);
  // 캐릭터별 대화 — 방을 나갔다 들어와도 세션 동안은 이어진다(새로고침하면 초기화).
  const [threads, setThreads] = useState<Record<string, CounselMessage[]>>({});
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const persona = getPersona(openId ?? DEFAULT_PERSONA.id);
  const messages = openId ? threads[openId] ?? [] : [];

  // 열린 방에만 메시지를 덧붙인다.
  const append = useCallback((...msgs: CounselMessage[]) => {
    setThreads((prev) => {
      if (!openId) return prev;
      return { ...prev, [openId]: [...(prev[openId] ?? []), ...msgs] };
    });
  }, [openId]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 오면 채팅 하단으로 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 타자기 tick마다 하단 유지 (즉시 스크롤)
  const scrollToEnd = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" });
  }, []);

  // textarea 높이 자동 조절 (최소 1줄 ~ 최대 5줄)
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const MAX = 114; // wrapper 세로 padding(12px) 제외한 5줄 최대
    el.style.height = "auto";
    const natural = el.scrollHeight;
    el.style.height = `${Math.min(natural, MAX)}px`;
    el.style.overflowY = natural >= MAX ? "scroll" : "hidden";
  }, []);

  const resetTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.overflowY = "hidden";
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    // 1층 클라이언트 인젝션 방어
    if (guardInput(text) === null) {
      append({ role: "wang", text: persona.reject });
      setInputText("");
      resetTextarea();
      return;
    }

    const userMsg: CounselMessage = { role: "me", text };
    append(userMsg);
    setInputText("");
    resetTextarea();
    setLoading(true);

    try {
      const { reply, src } = await getCounsel({
        chart,
        messages: [...messages, userMsg],
        personaId: persona.id,
      });
      append({ role: "wang", text: reply, src });
    } catch {
      append({ role: "wang", text: persona.error });
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, messages, chart, persona, append, resetTextarea]);

  // 방 입장 — 첫 입장이면 인사말로 대화를 시작한다.
  const enterRoom = (p: Persona) => {
    setThreads((prev) => (prev[p.id] ? prev : { ...prev, [p.id]: [welcomeOf(p)] }));
    setInputText("");
    setOpenId(p.id);
  };

  // 목록에 보일 미리보기 — 마지막 대화, 없으면 캐릭터 소개.
  const previewOf = (p: Persona) => {
    const thread = threads[p.id];
    return thread?.length ? thread[thread.length - 1].text : p.tagline;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 추천질문 탭 → 입력창 채우기 + 바텀시트 닫기
  const pickSuggested = (q: string) => {
    setInputText(q);
    setSheetOpen(false);
    setTimeout(() => {
      autoResize();
      textareaRef.current?.focus();
    }, 0);
  };

  // 상단 사주 스트립 가로 이동 — 데스크톱: 마우스 휠(세로→가로) + 클릭 드래그
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0 });
  const onStripWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
  };
  const onStripDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !stripRef.current) return;
    drag.current = { down: true, x: e.clientX, left: stripRef.current.scrollLeft };
  };
  const onStripMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.down || !stripRef.current) return;
    stripRef.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endStripDrag = () => { drag.current.down = false; };

  const identity = useMemo(() => deriveIdentity(chart), [chart]);

  // 채팅방 목록
  if (!openId) {
    return (
      <div className="db-page ac-page">
        <header className="db-topbar">
          <button type="button" className="db-back-arrow" onClick={() => onSelect?.("home")} aria-label="용궁 홈으로 돌아가기">
            ←
          </button>
        </header>

        <main className="ac-main">
          <ul className="ac-rooms">
            {PERSONAS.map((p) => (
              <li key={p.id}>
                <button type="button" className="ac-room" onClick={() => enterRoom(p)}>
                  <img src={p.icon} alt="" className="ac-room-img" />
                  <span className="ac-room-body">
                    <span className="ac-room-name">{p.name}</span>
                    <span className="ac-room-preview">{previewOf(p)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </main>

        <BottomNav active="ai" onSelect={onSelect} />
      </div>
    );
  }

  // 방 내부
  return (
    <div className="db-page ac-page">
      {/* 상단 바 */}
      <header className="db-topbar">
        <button type="button" className="db-back-arrow" onClick={() => setOpenId(null)} aria-label="상담 목록으로 돌아가기">
          ←
        </button>
        <span className="ac-room-title">{persona.name}</span>
      </header>


      {/* 상단 고정: 캐릭터가 살펴본 그대 (일간 + 사주 전체 스와이프) */}
      <div className="ac-identity">
        <div className="ac-char">
          <div
            className="ac-char-hanja"
            style={{ background: `linear-gradient(135deg, ${identity.color}55, ${identity.color}22)`,
                     borderColor: `${identity.color}66` }}
          >{identity.hanja}</div>
          <div className="ac-char-meta">
            <div className="ac-char-type">{identity.typeLabel}</div>
            <div className="ac-char-tags">{identity.tags}</div>
          </div>
        </div>
        <div
          ref={stripRef}
          className="ac-strip"
          aria-label="그대의 사주"
          onWheel={onStripWheel}
          onPointerDown={onStripDown}
          onPointerMove={onStripMove}
          onPointerUp={endStripDrag}
          onPointerLeave={endStripDrag}
        >
          {identity.chips.map((chip) => (
            <span key={chip} className="ac-chip">{chip}</span>
          ))}
        </div>
      </div>

      {/* 채팅 */}
      <main className="ac-main">
        <div className="ac-chat">
          {messages.map((msg, i) => (
            <div key={i} className={`ac-msg ac-msg--${msg.role}`}>
              <span className="ac-who">{msg.role === "wang" ? persona.name : "나"}</span>
              <p className="ac-text">
                {msg.role === "wang" ? <TypewriterText text={msg.text} onTick={scrollToEnd} /> : msg.text}
              </p>
            </div>
          ))}
          {loading && (
            <div className="ac-msg ac-msg--wang">
              <span className="ac-who">{persona.name}</span>
              <p className="ac-text ac-loading">···</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* 하단 입력 — 통합 pill: [✦ 추천] [입력] [여의주 전송] 한 줄 */}
      <div className="ac-composer">
        <div className="ac-input-wrap">
          <button
            type="button"
            className="ac-suggest-btn"
            aria-label="추천 질문"
            onClick={() => setSheetOpen(true)}
          >
            ✦
          </button>
          <textarea
            ref={textareaRef}
            className="ac-input"
            placeholder="궁금한 걸 물어보세요… (Shift+Enter 줄바꿈)"
            aria-label="상담 질문 입력"
            rows={1}
            value={inputText}
            disabled={loading}
            onChange={(e) => { setInputText(e.target.value); autoResize(); }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="ac-send"
            aria-label="전송"
            disabled={loading || !inputText.trim()}
            onClick={handleSend}
          >
            {loading ? "…" : "↑"}
          </button>
        </div>
      </div>

      <BottomNav active="ai" onSelect={onSelect} />

      {/* 추천질문 바텀시트 */}
      {sheetOpen && (
        <div className="ac-sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div className="ac-sheet" role="dialog" aria-label="추천 질문" onClick={(e) => e.stopPropagation()}>
            <div className="ac-sheet-handle" aria-hidden="true" />
            <div className="ac-sheet-title">무엇이 궁금한가</div>
            <ul className="ac-sheet-list">
              {SUGGESTED.map((q) => (
                <li key={q}>
                  <button type="button" className="ac-sheet-item" onClick={() => pickSuggested(q)}>
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

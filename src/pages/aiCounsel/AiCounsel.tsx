import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import BottomNav from "../../components/layout/BottomNav";
import "./aiCounsel.css";
import type { AiCounselProps } from "./types";

// 정적 추천 질문 (A단계 하드코딩 · 이후 상수파일/AI 생성으로 교체)
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

// AI 용왕 상담 화면 — 화면 틀(정적) 단계.
// chart 등 props 는 기능(C) 단계에서 사용. 지금은 구조·디자인만.
export default function AiCounsel(_props: AiCounselProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Enter = 전송, Shift+Enter = 줄바꿈
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // TODO: 전송 로직 (C단계)
    }
  };

  // 상단 사주 스트립 가로 이동 — 데스크톱: 마우스 휠(세로→가로) + 클릭 드래그, 모바일: 네이티브 터치
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
  const endStripDrag = () => {
    drag.current.down = false;
  };

  return (
    <div className="db-page ac-page">
      {/* 상단 바 */}
      <header className="db-topbar">
        <span className="db-logo">🐉 용왕님 상담</span>
        <span className="ac-limit">오늘 3/5</span>
      </header>

      {/* 상단 고정: 용왕이 살펴본 그대 (캐릭터 + 사주 전체 스와이프) */}
      <div className="ac-identity">
        <div className="ac-char">
          <div className="ac-char-hanja">己</div>
          <div className="ac-char-meta">
            <div className="ac-char-type">기토 · 넓은 대지</div>
            <div className="ac-char-tags">#포용 #끈기 #현실감각</div>
          </div>
        </div>
        <div
          ref={stripRef}
          className="ac-strip"
          aria-label="용왕이 살펴본 그대의 사주"
          onWheel={onStripWheel}
          onPointerDown={onStripDown}
          onPointerMove={onStripMove}
          onPointerUp={endStripDrag}
          onPointerLeave={endStripDrag}
        >
          <span className="ac-chip">土 강 · 金 부족</span>
          <span className="ac-chip">재성 발달</span>
          <span className="ac-chip">도화살</span>
          <span className="ac-chip">역마살</span>
          <span className="ac-chip">천을귀인</span>
          <span className="ac-chip">올해 丙午 · 상생</span>
          <span className="ac-chip">대운 乙亥</span>
        </div>
      </div>

      {/* 채팅 (스크림 위) */}
      <main className="ac-main">
        <div className="ac-chat">
          <div className="ac-msg ac-msg--wang">
            <span className="ac-who">용왕</span>
            <p className="ac-text">짐이 그대의 사주를 이미 살펴보았노라. 무엇이 궁금한가, 편히 물으라.</p>
          </div>
          <div className="ac-msg ac-msg--me">
            <span className="ac-who">나</span>
            <p className="ac-text">올해 이직해도 될까요?</p>
          </div>
          <div className="ac-msg ac-msg--wang">
            <span className="ac-who">용왕</span>
            <p className="ac-text">
              올해 병오년은 그대의 기운이 강해지는 해라, 새 자리를 찾기에 나쁘지 않으니라. 다만 서두르지 말고 신중히
              정하거라.
            </p>
            <span className="ac-src">근거: 세운 丙午 × 일간 己 상생(+2)</span>
          </div>
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
            onChange={(e) => {
              setInputText(e.target.value);
              autoResize();
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="ac-send" aria-label="전송">↑</button>
        </div>
      </div>

      <BottomNav active="ai" />

      {/* 추천질문 바텀시트 */}
      {sheetOpen && (
        <div className="ac-sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div className="ac-sheet" role="dialog" aria-label="추천 질문" onClick={(e) => e.stopPropagation()}>
            <div className="ac-sheet-handle" aria-hidden="true" />
            <div className="ac-sheet-title">무엇이 궁금한가</div>
            <ul className="ac-sheet-list">
              {SUGGESTED.map((q) => (
                <li key={q}>
                  <button type="button" className="ac-sheet-item" onClick={() => setSheetOpen(false)}>
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

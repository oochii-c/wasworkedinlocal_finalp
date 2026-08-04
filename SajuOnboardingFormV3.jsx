import React, { useEffect, useRef, useState } from "react";
import "./SajuOnboardingFormV3.css";

/**
 * AI 사주 온보딩 폼 (한지 · 인장 버전) - React
 * - saju_onboarding_v3.html을 동일한 디자인/동작으로 컴포넌트화했습니다.
 * - 스타일은 SajuOnboardingFormV3.css로 분리되어 있으며, 모든 클래스는 .saju-v3로 스코프됩니다.
 * - 폼 작성 → 로딩(분석 중) → 완료 3단계 흐름을 그대로 구현했습니다.
 */

const BIRTHPLACES = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도",
  "경상남도", "제주특별자치도", "해외",
];

const LOADING_MESSAGES = [
  "입력하신 정보를 확인하고 있어요...",
  "생년월일시를 사주팔자로 변환하고 있어요...",
  "오행(五行)의 균형을 분석하고 있어요...",
  "십성과 대운의 흐름을 살펴보고 있어요...",
  "결과를 정리하고 있어요...",
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function SajuOnboardingFormV3() {
  const [stage, setStage] = useState("form"); // 'form' | 'loading' | 'success'

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [calendarType, setCalendarType] = useState("양력");
  const [birthdate, setBirthdate] = useState("");
  const [ampm, setAmpm] = useState("");
  const [birthHour, setBirthHour] = useState("");
  const [birthMinute, setBirthMinute] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [birthplace, setBirthplace] = useState("");
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);

  const nameInputRef = useRef(null);

  // 로딩 화면 상태
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [loadingTextVisible, setLoadingTextVisible] = useState(true);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if (stage !== "loading") return;

    setLoadingIdx(0);
    setLoadingTextVisible(true);
    setProgress(8);

    const textTimer = setInterval(() => {
      setLoadingTextVisible(false);
      setTimeout(() => {
        setLoadingIdx((prev) => prev + 1);
        setLoadingTextVisible(true);
      }, 180);
    }, 900);

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(96, prev + Math.random() * 10 + 4));
    }, 350);

    const finishTimer = setTimeout(() => {
      clearInterval(textTimer);
      clearInterval(progressTimer);
      setProgress(100);
      setTimeout(() => {
        setStage("success");
      }, 250);
    }, 2600);

    return () => {
      clearInterval(textTimer);
      clearInterval(progressTimer);
      clearTimeout(finishTimer);
    };
  }, [stage]);

  function handleUnknownTimeChange(checked) {
    setUnknownTime(checked);
    if (checked) {
      setAmpm("");
      setBirthHour("");
      setBirthMinute("");
    }
  }

  function validate() {
    const next = {};

    if (!name.trim()) next.name = true;
    if (!gender) next.gender = true;
    if (!birthdate.trim()) next.birthdate = true;

    const timeInvalid = !unknownTime && (!ampm || !birthHour || !birthMinute);
    if (timeInvalid) next.birthtime = true;

    if (!agreePrivacy) next.agreePrivacy = true;
    if (!agreeAge) next.agreeAge = true;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const timeStr = unknownTime
      ? "모름"
      : `${ampm} ${birthHour}시 ${String(birthMinute).padStart(2, "0")}분`.trim();

    const rawDate = birthdate.trim();
    const digits = rawDate.replace(/\D/g, "");
    let dateStr = rawDate || "-";
    if (digits.length === 8) {
      dateStr = `${digits.slice(0, 4)}년 ${Number(digits.slice(4, 6))}월 ${Number(
        digits.slice(6, 8)
      )}일`;
    }

    setSummary({
      name: name || "-",
      gender: gender || "-",
      dateStr,
      calendarType: calendarType || "-",
      timeStr,
      birthplace: birthplace || "-",
    });

    setStage("loading");
  }

  function handleReset() {
    setName("");
    setGender("");
    setCalendarType("양력");
    setBirthdate("");
    setAmpm("");
    setBirthHour("");
    setBirthMinute("");
    setUnknownTime(false);
    setBirthplace("");
    setAgreeAge(false);
    setAgreePrivacy(false);
    setAgreeMarketing(false);
    setErrors({});
    setSummary(null);
    setStage("form");
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus({ preventScroll: true });
      }
    }, 0);
  }

  const activeStepIndex = loadingIdx % 4;
  const activeMessage = LOADING_MESSAGES[loadingIdx % LOADING_MESSAGES.length];

  return (
    <div className="saju-v3">
      <div className="wrap">
        {stage !== "success" && stage !== "loading" && (
          <div className="hero">
            <div className="seal">四柱</div>
            <span className="badge">AI 사주 상담 서비스</span>
            <h1>내 사주 보기</h1>
            <p>
              정확한 사주 풀이를 위해 아래 정보를 입력해 주세요.
              <br />
              입력하신 정보는 상담 목적으로만 사용됩니다.
            </p>
          </div>
        )}

        {stage === "form" && (
          <form noValidate onSubmit={handleSubmit}>
            {/* 1. 기본 인적사항 */}
            <div className="section">
              <div className="section-title">
                <span className="num">1</span>기본 인적사항
              </div>
              <div className="section-desc">사주 풀이의 기본이 되는 정보입니다.</div>

              <div className={`field${errors.name ? " invalid" : ""}`}>
                <label className="field-label" htmlFor="name">
                  이름<span className="req">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  id="name"
                  name="name"
                  placeholder="실명을 입력해 주세요"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div className="error-msg">이름을 입력해 주세요.</div>
              </div>

              <div className="row2">
                <div className={`field${errors.gender ? " invalid" : ""}`}>
                  <label className="field-label">
                    성별<span className="req">*</span>
                  </label>
                  <div className="radio-row">
                    <label className="pill">
                      <input
                        type="radio"
                        name="gender"
                        value="여성"
                        checked={gender === "여성"}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      <span>여성</span>
                    </label>
                    <label className="pill">
                      <input
                        type="radio"
                        name="gender"
                        value="남성"
                        checked={gender === "남성"}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      <span>남성</span>
                    </label>
                  </div>
                  <div className="error-msg">성별을 선택해 주세요.</div>
                </div>

                <div className="field">
                  <label className="field-label">양력 / 음력<span className="req">*</span></label>
                  <div className="radio-row">
                    <label className="pill">
                      <input
                        type="radio"
                        name="calendarType"
                        value="양력"
                        checked={calendarType === "양력"}
                        onChange={(e) => setCalendarType(e.target.value)}
                      />
                      <span>양력</span>
                    </label>
                    <label className="pill">
                      <input
                        type="radio"
                        name="calendarType"
                        value="음력"
                        checked={calendarType === "음력"}
                        onChange={(e) => setCalendarType(e.target.value)}
                      />
                      <span>음력</span>
                    </label>
                    <label className="pill">
                      <input
                        type="radio"
                        name="calendarType"
                        value="음력(윤달)"
                        checked={calendarType === "음력(윤달)"}
                        onChange={(e) => setCalendarType(e.target.value)}
                      />
                      <span>음력(윤달)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className={`field${errors.birthdate ? " invalid" : ""}`}>
                <label className="field-label" htmlFor="birthdate">
                  생년월일<span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="birthdate"
                  name="birthdate"
                  placeholder="예: 1995-05-20 또는 19950520"
                  inputMode="numeric"
                  autoComplete="off"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
                <div className="error-msg">생년월일을 입력해 주세요.</div>
              </div>

              <div className={`field${errors.birthtime ? " invalid" : ""}`}>
                <label className="field-label">태어난 시간<span className="req">*</span></label>
                <div className="time-row">
                  <div className="radio-row ampm-row">
                    <label className="pill">
                      <input
                        type="radio"
                        name="ampm"
                        value="오전"
                        disabled={unknownTime}
                        checked={ampm === "오전"}
                        onChange={(e) => setAmpm(e.target.value)}
                      />
                      <span>오전</span>
                    </label>
                    <label className="pill">
                      <input
                        type="radio"
                        name="ampm"
                        value="오후"
                        disabled={unknownTime}
                        checked={ampm === "오후"}
                        onChange={(e) => setAmpm(e.target.value)}
                      />
                      <span>오후</span>
                    </label>
                  </div>
                  <select
                    id="birthHour"
                    name="birthHour"
                    aria-label="시"
                    disabled={unknownTime}
                    value={birthHour}
                    onChange={(e) => setBirthHour(e.target.value)}
                  >
                    <option value="">시</option>
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}시
                      </option>
                    ))}
                  </select>
                  <select
                    id="birthMinute"
                    name="birthMinute"
                    aria-label="분"
                    disabled={unknownTime}
                    value={birthMinute}
                    onChange={(e) => setBirthMinute(e.target.value)}
                  >
                    <option value="">분</option>
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}분
                      </option>
                    ))}
                  </select>
                </div>
                <div className="unknown-time">
                  <input
                    type="checkbox"
                    id="unknownTime"
                    name="unknownTime"
                    checked={unknownTime}
                    onChange={(e) => handleUnknownTimeChange(e.target.checked)}
                  />
                  <label htmlFor="unknownTime">정확한 태어난 시간을 모릅니다</label>
                </div>
                <div className="error-msg">태어난 시간을 입력하거나 '모름'을 선택해 주세요.</div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="birthplace">
                  태어난 지역 <span className="opt">(선택)</span>
                </label>
                <select
                  id="birthplace"
                  name="birthplace"
                  value={birthplace}
                  onChange={(e) => setBirthplace(e.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {BIRTHPLACES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="helper">출생 지역에 따라 시간 보정이 필요한 경우 참고합니다.</div>
              </div>
            </div>

            {/* 2. 약관 동의 */}
            <div className="section">
              <div className="section-title">
                <span className="num">2</span>약관 및 동의
              </div>

              <div className="consent-box">
                <div className="consent-row">
                  <input
                    type="checkbox"
                    id="agreeAge"
                    name="agreeAge"
                    checked={agreeAge}
                    onChange={(e) => setAgreeAge(e.target.checked)}
                  />
                  <div className="consent-text">
                    <strong>만 14세 이상입니다.</strong>
                    <span className="req">*</span>
                  </div>
                </div>
              </div>

              <div className={`consent-box${errors.agreePrivacy ? " invalid" : ""}`}>
                <div className="consent-row">
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    name="agreePrivacy"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                  />
                  <div className="consent-text">
                    <strong>[필수] 개인정보 수집 및 이용 동의</strong>
                    <span className="req">*</span>
                  </div>
                </div>
                <div className="consent-detail">
                  수집 항목: 이름, 성별, 생년월일시, 태어난 지역 / 수집 목적: AI 사주 분석 결과 제공 / 보유 기간: 서비스 이용 종료 후 1년
                </div>
                <div className="error-msg">필수 동의 항목입니다.</div>
              </div>

              <div className="consent-box">
                <div className="consent-row">
                  <input
                    type="checkbox"
                    id="agreeMarketing"
                    name="agreeMarketing"
                    checked={agreeMarketing}
                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                  />
                  <div className="consent-text">[선택] 신규 서비스 및 이벤트 안내 수신 동의</div>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              사주 보기
            </button>
            <div className="footer-note">
              입력하신 정보는 AI 사주 분석 목적 외에는 사용되지 않으며,
              <br />
              안전하게 관리됩니다.
            </div>
          </form>
        )}

        {stage === "loading" && (
          <div className="loading-screen" style={{ display: "block" }}>
            <div className="glyph">命 · 運 · 財</div>
            <div className="ring-wrap">
              <div className="ring-track"></div>
              <div className="ring-spin"></div>
              <div className="ring-spin reverse"></div>
              <div className="ring-glyph">🔮</div>
            </div>
            <h2>사주를 풀이하고 있어요</h2>
            <div className="loading-text" style={{ opacity: loadingTextVisible ? 1 : 0 }}>
              {activeMessage}
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-pct">{Math.round(progress)}%</div>
            <div className="steps">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={i === activeStepIndex ? "active" : ""}></span>
              ))}
            </div>
          </div>
        )}

        {stage === "success" && summary && (
          <div className="success-screen" style={{ display: "block" }}>
            <div className="icon">✓</div>
            <h2>사주 분석을 준비했어요</h2>
            <p>
              입력해 주신 정보를 바탕으로 사주를 풀이하고 있어요.
              <br />
              잠시만 기다려 주세요.
            </p>
            <div className="summary">
              <div>
                <b>이름</b>
                {summary.name}
              </div>
              <div>
                <b>성별</b>
                {summary.gender}
              </div>
              <div>
                <b>생년월일</b>
                {summary.dateStr} ({summary.calendarType})
              </div>
              <div>
                <b>태어난 시간</b>
                {summary.timeStr}
              </div>
              <div>
                <b>태어난 지역</b>
                {summary.birthplace}
              </div>
            </div>
            <button type="button" className="reset-btn" onClick={handleReset}>
              다시 작성하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

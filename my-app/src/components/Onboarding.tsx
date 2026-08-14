import "./Onboarding.css"
import { useState } from "react"
import { Solar, Lunar, LunarYear } from "lunar-typescript"
import { fetchGeminiSaju, fetchSeWunComment, type GeminiSajuResult } from "../services/gemini"

// ── 한국 서머타임(DST) 기간 ──
// 이 기간에 기록된 시각은 표준시보다 +1시간이므로 실제 태양시 계산 시 -1시간 필요
const DST_PERIODS = [
  { s: [1948, 6, 1],  e: [1948, 9, 13] },
  { s: [1949, 4, 3],  e: [1949, 9, 11] },
  { s: [1950, 4, 1],  e: [1950, 9, 10] },
  { s: [1951, 5, 6],  e: [1951, 9,  9] },
  { s: [1955, 5, 5],  e: [1955, 9,  9] },
  { s: [1956, 5, 20], e: [1956, 9, 30] },
  { s: [1957, 5, 5],  e: [1957, 9, 22] },
  { s: [1958, 5, 4],  e: [1958, 9, 21] },
  { s: [1959, 5, 3],  e: [1959, 9, 20] },
  { s: [1960, 5, 1],  e: [1960, 9, 18] },
  { s: [1987, 5, 10], e: [1987, 10, 11] },
  { s: [1988, 5, 8],  e: [1988, 10,  9] },
]

function toN(y: number, m: number, d: number) { return y * 10000 + m * 100 + d }

// ── 간체 → 번체 변환 (lunar-typescript가 간체 중국어로 출력하는 글자들) ──
const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  "财": "財", "伤": "傷", "杀": "殺",
  "涧": "澗", "头": "頭", "仓": "倉",
  "鸣": "鳴", "离": "離", "专": "專",
  "阳": "陽", "错": "錯", "门": "門",
  "纳": "納", "扫": "掃", "进": "進",
  "灶": "竈", "动": "動", "开": "開",
  "坟": "墳", "寿": "壽", "禄": "祿",
  "灯": "燈", "炉": "爐", "归": "歸",
}

function toTraditional(text: string): string {
  return text.split("").map(ch => SIMPLIFIED_TO_TRADITIONAL[ch] ?? ch).join("")
}

function toTradArr(arr: string[]): string[] {
  return arr.map(toTraditional)
}

// 십신 → 5그룹 매핑 (십성성향 레이더용)
const SHISHEN_TO_GROUP: Record<string, string> = {
  "比肩": "비겁", "劫財": "비겁",
  "食神": "식상", "傷官": "식상",
  "偏財": "재성", "正財": "재성",
  "偏官": "관성", "七殺": "관성", "正官": "관성",
  "偏印": "인성", "正印": "인성",
}

const GAN_LIST = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]
const ZHI_LIST = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
const WUXING_ORDER = ["木","火","土","金","水"]

// ── 천간 → 오행 매핑 ──
const GAN_TO_WUXING: Record<string, string> = {
  "甲": "木", "乙": "木",
  "丙": "火", "丁": "火",
  "戊": "土", "己": "土",
  "庚": "金", "辛": "金",
  "壬": "水", "癸": "水",
}

// 세운 천간 × 일간 오행 관계 → 별점 계산
function seWunScore(yearGan: string, dayGan: string): { rel: string; stars: number } {
  const yw = GAN_TO_WUXING[yearGan], dw = GAN_TO_WUXING[dayGan]
  if (!yw || !dw) return { rel: "?", stars: 3 }
  if (yw === dw) return { rel: "비화", stars: 3 }
  const yi = WUXING_ORDER.indexOf(yw), di = WUXING_ORDER.indexOf(dw)
  if ((yi + 1) % 5 === di) return { rel: "상생", stars: 5 }  // 년이 일간 생
  if ((yi + 2) % 5 === di) return { rel: "상극", stars: 1 }  // 년이 일간 극
  if ((di + 1) % 5 === yi) return { rel: "설기", stars: 4 }  // 일간이 년 생
  return { rel: "재성", stars: 4 }                            // 일간이 년 극
}

// 8자 오행 + 지장간 오행을 합산해 木火土金水 개수와 비율(%) 계산
// ※ 지장간 제외하고 8자만으로 계산하는 방식도 있음 (pillars 파라미터를 넘기지 않으면 됨)
//    → 그 방식은 단순하지만 지지 속 숨은 기운(통근 등)을 반영 못 함
function calcWuXingRatio(
  baZiWuXing: string[],
  pillars: { hideGan: string[] }[]
): { count: Record<string, number>; ratio: Record<string, number> } {
  const count: Record<string, number> = { "木": 0, "火": 0, "土": 0, "金": 0, "水": 0 }

  // 8자 오행: 각 항목이 "천간오행+지지오행" 2글자
  for (const wx of baZiWuXing) {
    for (const ch of wx) {
      if (ch in count) count[ch]++
    }
  }

  // 지장간 오행
  for (const pillar of pillars) {
    for (const gan of pillar.hideGan) {
      const wx = GAN_TO_WUXING[gan]
      if (wx) count[wx]++
    }
  }

  const total = Object.values(count).reduce((a, b) => a + b, 0)
  const ratio: Record<string, number> = {}
  for (const [k, v] of Object.entries(count)) {
    ratio[k] = total > 0 ? Math.round((v / total) * 100) : 0
  }

  return { count, ratio }
}

function isDST(y: number, m: number, d: number) {
  const n = toN(y, m, d)
  return DST_PERIODS.some(({ s, e }) => n >= toN(s[0], s[1], s[2]) && n < toN(e[0], e[1], e[2]))
}

/**
 * 입력 KST 시각 → 사주 계산용 보정 시각
 *
 * 보정 순서:
 * 1. DST 기간이면 -60분 (입력 시각이 이미 서머타임 기준이므로)
 * 2. 진태양시 보정: 서울(127°E) vs 표준경선(135°E) → -32분
 *
 * ※ 야자시(밤 23시대)는 lunar-typescript가 자정 기준으로 일주를 유지하도록
 *   이미 처리하므로 여기서 별도 날짜 보정을 하지 않는다.
 */
function correctToSaju(year: number, month: number, day: number, hour: number, minute: number) {
  let offsetMin = -32
  const dstApplied = isDST(year, month, day)
  if (dstApplied) offsetMin -= 60

  const baseMs = new Date(year, month - 1, day, hour, minute).getTime()
  const d = new Date(baseMs + offsetMin * 60 * 1000)

  return {
    year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
    hour: d.getHours(), minute: d.getMinutes(), dstApplied, offsetMin,
  }
}

// 사주 한 기둥(연/월/일/시) 데이터 묶음
type Pillar = {
  label: string
  ganZhi: string; gan: string; zhi: string
  wuXing: string; naYin: string
  shiShenGan: string; shiShenZhi: string[]
  diShi: string; xunKong: string; hideGan: string[]
}

export type SajuData = {
  pillars: Pillar[]
  baZi: string[]; baZiWuXing: string[]
  baZiShiShenGan: string[]; baZiShiShenZhi: string[][]
  dayGan: string
  taiYuan: string; taiYuanNaYin: string
  mingGong: string; mingGongNaYin: string
  shenGong: string
  dayJiShen: string[]; dayXiongSha: string[]
  daYun: { ganZhi: string; startAge: number; endAge: number; startYear: number; endYear: number }[]
  daYunStart: string; isForward: boolean
  wuXingRatio: { count: Record<string, number>; ratio: Record<string, number> }
  simseongRatio: Record<string, number>  // 십성 5그룹 비율 (레이더 차트용)
  seWun: { year: number; ganZhi: string; rel: string; stars: number }[]
  timeUnknown: boolean
  solarStr: string    // 보정 후 양력 시각 (디버그·표시용)
  dstApplied: boolean
}

/**
 * 사주 계산 핵심 함수
 *
 * 처리 순서:
 * 1. 음력이면 양력으로 변환
 * 2. 시간 입력이 있으면 correctToSaju로 보정 (DST + 진태양시 + 야자시)
 * 3. 보정된 Solar 객체로 EightChar(사주팔자) 추출
 */
function calcSaju(
  inputYear: number, inputMonth: number, inputDay: number,
  inputHour: number, inputMinute: number,
  isLeap: boolean,
  calType: "양력" | "음력",
  gender: "남자" | "여자",
  timeUnknown: boolean
): SajuData {
  // 1. 양력 기준 날짜 확보 (음력이면 변환)
  let baseYear = inputYear, baseMonth = inputMonth, baseDay = inputDay
  if (calType === "음력") {
    // 윤달은 음수 월로 표현 (lunar-typescript 규칙)
    const lunarBase = Lunar.fromYmd(inputYear, isLeap ? -inputMonth : inputMonth, inputDay)
    const s = lunarBase.getSolar()
    baseYear = s.getYear(); baseMonth = s.getMonth(); baseDay = s.getDay()
  }

  // 2. 시간 보정
  let finalYear = baseYear, finalMonth = baseMonth, finalDay = baseDay
  let finalHour = 12, finalMinute = 0  // 시간 모름이면 오시(12시)로 대체
  let dstApplied = false

  if (!timeUnknown) {
    const corr = correctToSaju(baseYear, baseMonth, baseDay, inputHour, inputMinute)
    finalYear = corr.year; finalMonth = corr.month; finalDay = corr.day
    finalHour = corr.hour; finalMinute = corr.minute
    dstApplied = corr.dstApplied
  }

  const solar = Solar.fromYmdHms(finalYear, finalMonth, finalDay, finalHour, finalMinute, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const gNum = gender === "남자" ? 1 : 0  // lunar-typescript: 남자=1, 여자=0

  const PILLAR_KEYS = [
    { label: "연", p: "Year" as const },
    { label: "월", p: "Month" as const },
    { label: "일", p: "Day" as const },
    { label: "시", p: "Time" as const },
  ]

  const pillars: Pillar[] = PILLAR_KEYS.map(({ label, p }) => ({
    label,
    ganZhi:     ec[`get${p}`](),
    gan:        ec[`get${p}Gan`](),
    zhi:        ec[`get${p}Zhi`](),
    wuXing:     ec[`get${p}WuXing`](),
    naYin:      toTraditional(ec[`get${p}NaYin`]()),
    shiShenGan: toTraditional(ec[`get${p}ShiShenGan`]()),
    shiShenZhi: toTradArr(ec[`get${p}ShiShenZhi`]()),
    diShi:      ec[`get${p}DiShi`](),
    xunKong:    ec[`get${p}XunKong`](),
    hideGan:    ec[`get${p}HideGan`](),
  }))

  const yun = ec.getYun(gNum)
  const rawDaYun = yun.getDaYun()

  // 대운: ganZhi가 빈 초기 기간 제거, 나이 = 대운 시작 연도 - 생년(양력) - 1 (만나이 내림)
  const daYun = rawDaYun
    .filter(dy => dy.getGanZhi() !== "")
    .slice(0, 8)
    .map(dy => ({
      ganZhi: dy.getGanZhi(),
      startAge: dy.getStartYear() - baseYear - 1,
      endAge:   dy.getEndYear()   - baseYear - 1,
      startYear: dy.getStartYear(),
      endYear:   dy.getEndYear(),
    }))

  // 십성성향: 천간+지지 십신을 5그룹으로 분류해 비율 계산
  const groupCount: Record<string, number> = { "비겁": 0, "식상": 0, "재성": 0, "관성": 0, "인성": 0 }
  for (const pl of pillars) {
    const g = SHISHEN_TO_GROUP[pl.shiShenGan]
    if (g) groupCount[g]++
    for (const ss of pl.shiShenZhi) {
      const zg = SHISHEN_TO_GROUP[ss]
      if (zg) groupCount[zg]++
    }
  }
  const gTotal = Object.values(groupCount).reduce((a, b) => a + b, 0)
  const simseongRatio: Record<string, number> = {}
  for (const [k, v] of Object.entries(groupCount)) {
    simseongRatio[k] = gTotal > 0 ? Math.round((v / gTotal) * 100) : 0
  }

  const dayGanStr = ec.getDayGan()
  const seWun = daYun.flatMap(dy =>
    // endYear는 포함 경계(다음 대운 startYear === endYear+1) → +1 해야 마지막 해가 안 빠짐
    Array.from({ length: dy.endYear - dy.startYear + 1 }, (_, i) => {
      const y = dy.startYear + i
      const gz = GAN_LIST[(y - 4 + 4000) % 10] + ZHI_LIST[(y - 4 + 4800) % 12]
      return { year: y, ganZhi: gz, ...seWunScore(gz[0], dayGanStr) }
    })
  )

  return {
    pillars,
    baZi: lunar.getBaZi(), baZiWuXing: lunar.getBaZiWuXing(),
    baZiShiShenGan: toTradArr(lunar.getBaZiShiShenGan()),
    baZiShiShenZhi: [
      toTradArr(lunar.getBaZiShiShenYearZhi()), toTradArr(lunar.getBaZiShiShenMonthZhi()),
      toTradArr(lunar.getBaZiShiShenDayZhi()),  toTradArr(lunar.getBaZiShiShenTimeZhi()),
    ],
    dayGan: dayGanStr,
    taiYuan: ec.getTaiYuan(), taiYuanNaYin: toTraditional(ec.getTaiYuanNaYin()),
    mingGong: ec.getMingGong(), mingGongNaYin: toTraditional(ec.getMingGongNaYin()),
    shenGong: ec.getShenGong(),
    dayJiShen: toTradArr(lunar.getDayJiShen()), dayXiongSha: toTradArr(lunar.getDayXiongSha()),
    daYun, seWun,
    daYunStart: yun.getStartSolar().toYmd(), isForward: yun.isForward(),
    simseongRatio,
    wuXingRatio: calcWuXingRatio(lunar.getBaZiWuXing(), pillars),
    timeUnknown, solarStr: solar.toYmdHms(), dstApplied,
  }
}

// ── 온보딩 페이지 컴포넌트 ──
const Onboarding = () => {
  const [userName, setUserName]         = useState("테스트")
  const [gender, setGender]             = useState("여자")
  const [calendarType, setCalendarType] = useState<"양력" | "음력">("양력")
  const [isLeap, setIsLeap]             = useState(false)
  const [birthYear, setBirthYear]       = useState("1989")
  const [birthMonth, setBirthMonth]     = useState("10")
  const [birthDay, setBirthDay]         = useState("19")
  const [birthHour, setBirthHour]       = useState("")   // 0~23
  const [birthMinute, setBirthMinute]   = useState("")   // 0~59
  const [timeUnknown, setTimeUnknown]   = useState(false)
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [result, setResult]             = useState<SajuData | null>(null)
  const [aiResult, setAiResult]         = useState<GeminiSajuResult | null>(null)
  const [aiLoading, setAiLoading]       = useState(false)
  const [aiError, setAiError]           = useState<string | null>(null)
  // 세운 클릭 시 개별 AI 한줄평 캐시 (key: year, value: 텍스트 | "loading")
  const [seWunAiMap, setSeWunAiMap]     = useState<Record<number, string>>({})

  // 해당 연도·월에 윤달이 있는지 확인 (음력일 때만)
  const leapMonth = calendarType === "음력" && birthYear && birthMonth
    ? LunarYear.fromYear(parseInt(birthYear)).getLeapMonth()
    : 0
  const hasLeapThisMonth = leapMonth === parseInt(birthMonth)

  function validate() {
    const errs: Record<string, string> = {}
    if (!userName.trim()) errs.name = "이름을 입력해주세요"
    const y = parseInt(birthYear)
    if (!birthYear || isNaN(y) || y < 1900 || y > 2100) errs.year = "1900~2100 사이 연도를 입력하세요"
    if (!birthMonth) errs.month = "월을 선택하세요"
    if (!birthDay)   errs.day   = "일을 선택하세요"
    if (!timeUnknown) {
      const h = parseInt(birthHour), m = parseInt(birthMinute)
      if (birthHour === "" || isNaN(h) || h < 0 || h > 23) errs.time = "시(0~23)를 입력하세요"
      else if (birthMinute === "" || isNaN(m) || m < 0 || m > 59) errs.time = "분(0~59)을 입력하세요"
    }
    return errs
  }

  async function handleSeWunClick(sw: { year: number; ganZhi: string; rel: string }) {
    if (seWunAiMap[sw.year] || !result) return
    setSeWunAiMap(prev => ({ ...prev, [sw.year]: "…" }))
    try {
      const comment = await fetchSeWunComment(sw.year, sw.ganZhi, sw.rel, result.dayGan, gender)
      setSeWunAiMap(prev => ({ ...prev, [sw.year]: comment }))
    } catch {
      setSeWunAiMap(prev => ({ ...prev, [sw.year]: "오류" }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setAiResult(null)
    setAiError(null)
    try {
      const data = calcSaju(
        parseInt(birthYear), parseInt(birthMonth), parseInt(birthDay),
        parseInt(birthHour || "0"), parseInt(birthMinute || "0"),
        isLeap, calendarType, gender as "남자" | "여자", timeUnknown
      )
      setResult(data)

      // Gemini AI 호출
      setAiLoading(true)
      try {
        const ai = await fetchGeminiSaju(data, gender)
        setAiResult(ai)
      } catch (aiErr) {
        setAiError(aiErr instanceof Error ? aiErr.message : "AI 호출 실패")
      } finally {
        setAiLoading(false)
      }
    } catch {
      // 음력 날짜 범위 초과 등 라이브러리 내부 오류
      setErrors({ general: "날짜 정보가 올바르지 않습니다. 다시 확인해주세요." })
    }
  }

  function handleCalType(v: "양력" | "음력") {
    setCalendarType(v)
    setIsLeap(false)
  }

  return (
    <div className="onboarding-page">
      <form onSubmit={handleSubmit} noValidate className="onboarding-form">
        <h1 className="onboarding-title">당신의 사주를 봅니다</h1>
        <p className="onboarding-subtitle">생년월일시로 원국을 그립니다</p>

        {/* ── 이름 ── */}
        <div className="form-field">
          <label className="field-label" htmlFor="user-name">이름</label>
          <input
            className={`field-input${errors.name ? " input-error" : ""}`}
            type="text" id="user-name"
            value={userName} onChange={e => setUserName(e.target.value)}
            autoFocus
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        {/* ── 성별 ── */}
        <fieldset className="form-field">
          <legend className="field-label">성별</legend>
          <div className="segment">
            <input type="radio" id="gender-male" name="gender" value="남자"
              checked={gender === "남자"} onChange={e => setGender(e.target.value)} />
            <label className="segment-option" htmlFor="gender-male">남자</label>
            <input type="radio" id="gender-female" name="gender" value="여자"
              checked={gender === "여자"} onChange={e => setGender(e.target.value)} />
            <label className="segment-option" htmlFor="gender-female">여자</label>
          </div>
        </fieldset>

        {/* ── 생년월일시 ── */}
        <fieldset className="form-field">

          {/* 라벨 + 양력/음력 + 평/윤 (음력일 때만) */}
          <div className="calendar-header">
            <legend className="field-label">생년월일시</legend>
            <div className="cal-segment">
              {(["양력", "음력"] as const).map(v => (
                <label key={v} className={`cal-option${calendarType === v ? " cal-active" : ""}`}>
                  <input type="radio" name="calType" value={v}
                    checked={calendarType === v} onChange={() => handleCalType(v)} />
                  {v}
                </label>
              ))}
            </div>
            {calendarType === "음력" && (
              <div className="leap-toggle-wrap">
                <label className={`leap-option${!isLeap ? " leap-active" : ""}${!hasLeapThisMonth ? " leap-disabled" : ""}`}>
                  <input type="radio" name="leap" checked={!isLeap} onChange={() => setIsLeap(false)} />
                  평달
                </label>
                {/* 해당 연도·월에 윤달이 없으면 비활성 */}
                <label className={`leap-option${isLeap ? " leap-active" : ""}${!hasLeapThisMonth ? " leap-disabled" : ""}`}>
                  <input type="radio" name="leap" checked={isLeap}
                    onChange={() => hasLeapThisMonth && setIsLeap(true)} disabled={!hasLeapThisMonth} />
                  윤달
                </label>
              </div>
            )}
          </div>

          {/* 년 / 월 / 일 */}
          <div className="date-inputs-row">
            <div className="date-unit">
              <input
                className={`field-input${errors.year ? " input-error" : ""}`}
                type="number" placeholder="1990" min={1900} max={2100}
                value={birthYear} onChange={e => setBirthYear(e.target.value)}
              />
              <span className="date-unit-label">년</span>
            </div>
            <div className="date-unit">
              <select
                className={`field-input${errors.month ? " input-error" : ""}`}
                value={birthMonth} onChange={e => { setBirthMonth(e.target.value); setIsLeap(false) }}
              >
                <option value="">월</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <span className="date-unit-label">월</span>
            </div>
            <div className="date-unit">
              <select
                className={`field-input${errors.day ? " input-error" : ""}`}
                value={birthDay} onChange={e => setBirthDay(e.target.value)}
              >
                <option value="">일</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <span className="date-unit-label">일</span>
            </div>
          </div>
          {(errors.year || errors.month || errors.day) && (
            <span className="error-text">{errors.year || errors.month || errors.day}</span>
          )}

          {/* 시 / 분 + 시간모름 */}
          <div className="time-row">
            {!timeUnknown && (
              <>
                <div className="date-unit time-unit">
                  <input
                    className={`field-input${errors.time ? " input-error" : ""}`}
                    type="number" placeholder="22" min={0} max={23}
                    value={birthHour} onChange={e => setBirthHour(e.target.value)}
                  />
                  <span className="date-unit-label">시</span>
                </div>
                <div className="date-unit time-unit">
                  <input
                    className={`field-input${errors.time ? " input-error" : ""}`}
                    type="number" placeholder="58" min={0} max={59}
                    value={birthMinute} onChange={e => setBirthMinute(e.target.value)}
                  />
                  <span className="date-unit-label">분</span>
                </div>
              </>
            )}
            <label className="toggle time-unknown-toggle">
              <input className="toggle-input" type="checkbox"
                checked={timeUnknown}
                onChange={e => {
                  setTimeUnknown(e.target.checked)
                  if (e.target.checked) { setBirthHour(""); setBirthMinute("") }
                }}
              />
              <span className="toggle-track" aria-hidden="true"></span>
              <span className="toggle-text">시간 모름</span>
            </label>
          </div>
          {errors.time && <span className="error-text">{errors.time}</span>}
          {!timeUnknown && (
            <p className="time-note">서울 기준 진태양시 −32분 자동 보정</p>
          )}
        </fieldset>

        {errors.general && <p className="error-text error-general">{errors.general}</p>}

        <button className="submit-button" type="submit">원국 생성 →</button>
      </form>

      {/* ── 결과 팝업 (오버레이 클릭으로 닫기) ── */}
      {result && (
        <div className="saju-overlay" onClick={() => setResult(null)}>
          <div className="saju-modal" onClick={e => e.stopPropagation()}>
            <div className="saju-modal-header">
              <h2 className="saju-modal-title">사주 원국</h2>
              <p className="saju-modal-sub">
                보정 양력: {result.solarStr}
                {result.dstApplied && " (서머타임 적용)"}
                {" | 일간: "}{result.dayGan}
              </p>
              <button className="saju-close" onClick={() => setResult(null)} aria-label="닫기">✕</button>
            </div>

            {/* 사주 4기둥 표: pillars 배열이 연→시 순이므로 reverse해서 시→연 순으로 표시 */}
            <section className="saju-section">
              <h3 className="saju-section-title">사주 8자</h3>
              <table className="saju-table">
                <thead>
                  <tr>
                    <th></th>
                    {["시", "일", "월", "연"].map(l => <th key={l}>{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { row: "간지",     fn: (p: Pillar) => p.ganZhi },
                    { row: "천간",     fn: (p: Pillar) => p.gan },
                    { row: "지지",     fn: (p: Pillar) => p.zhi },
                    { row: "오행",     fn: (p: Pillar) => p.wuXing },
                    { row: "십신(간)", fn: (p: Pillar) => p.shiShenGan },
                    { row: "십신(지)", fn: (p: Pillar) => p.shiShenZhi.join(" ") },
                    { row: "십이운성", fn: (p: Pillar) => p.diShi },
                    { row: "지장간",   fn: (p: Pillar) => p.hideGan.join(" ") },
                    { row: "공망",     fn: (p: Pillar) => p.xunKong },
                    { row: "납음",     fn: (p: Pillar) => p.naYin },
                  ].map(({ row, fn }) => (
                    <tr key={row}>
                      <td className="row-label">{row}</td>
                      {[...result.pillars].reverse().map((p, i) => (
                        <td key={i} className={p.label === "일" ? "day-col" : ""}>
                          {/* 시간 모름이면 시주 칸은 대시 표시 */}
                          {p.label === "시" && result.timeUnknown ? "—" : fn(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 특수점 */}
            <section className="saju-section">
              <h3 className="saju-section-title">특수점</h3>
              <div className="saju-kv">
                <span>태원</span><span>{result.taiYuan} ({result.taiYuanNaYin})</span>
                <span>명궁</span><span>{result.mingGong} ({result.mingGongNaYin})</span>
                <span>신궁</span><span>{result.shenGong}</span>
              </div>
            </section>

            {/* 길신·흉살: 일주(생일) 기준 */}
            <section className="saju-section">
              <h3 className="saju-section-title">길신 / 흉살 (일주 기준)</h3>
              <div className="saju-kv">
                <span>길신</span><span>{result.dayJiShen.join(" · ") || "없음"}</span>
                <span>흉살</span><span>{result.dayXiongSha.join(" · ") || "없음"}</span>
              </div>
            </section>

            {/* 십성성향 (레이더 차트 데이터) */}
            <section className="saju-section">
              <h3 className="saju-section-title">십성 성향</h3>
              <div className="saju-kv">
                {[
                  { key: "비겁", label: "비겁(자립)" },
                  { key: "식상", label: "식상(표현)" },
                  { key: "재성", label: "재성(현실)" },
                  { key: "관성", label: "관성(책임)" },
                  { key: "인성", label: "인성(공부)" },
                ].map(({ key, label }) => (
                  <>
                    <span>{label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: "0 0 36px" }}>{result.simseongRatio[key]}%</span>
                      <span style={{ flex: 1, height: 8, background: "#e8e0cc", borderRadius: 4, overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", width: `${result.simseongRatio[key]}%`, background: "var(--cheong)", borderRadius: 4 }} />
                      </span>
                    </span>
                  </>
                ))}
              </div>
            </section>

            {/* AI 해석 결과 */}
            <section className="saju-section">
              <h3 className="saju-section-title">AI 해석</h3>
              {aiLoading && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>분석 중...</p>}
              {aiError && <p style={{ color: "var(--jeok)", fontSize: 13 }}>오류: {aiError}</p>}
              {aiResult && (
                <div className="saju-kv">
                  <span>유형</span><span>{aiResult.typeTitle}</span>
                  <span>태그</span><span>{aiResult.hashtags.join(" ")}</span>
                  <span>총운</span><span>{aiResult.sajuPuliy}</span>
                  <span>심성</span>
                  <span>
                    {Object.entries(aiResult.simseongScores).map(([k, v]) => `${k} ${v}`).join(" · ")}
                  </span>
                  <span>신살</span>
                  <span>
                    {aiResult.sinsal.length > 0
                      ? aiResult.sinsal.map(s => `${s.name}: ${s.desc}`).join(" / ")
                      : "없음"}
                  </span>
                  {aiResult.daYunRating.length > 0 && (
                    <>
                      <span>대운평</span>
                      <span>
                        {aiResult.daYunRating.map(d =>
                          `${d.ganZhi}(${d.startAge}세~) ${"★".repeat(d.rating)} ${d.comment}`
                        ).join(" / ")}
                      </span>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* 오행 분포 */}
            <section className="saju-section">
              <h3 className="saju-section-title">오행 분포 (8자 + 지장간)</h3>
              <div className="saju-kv">
                {["木", "火", "土", "金", "水"].map(wx => (
                  <><span>{wx}</span><span>{result.wuXingRatio.count[wx]}개 · {result.wuXingRatio.ratio[wx]}%</span></>
                ))}
              </div>
            </section>

            {/* 세운 (년도별 운세) */}
            <section className="saju-section">
              <h3 className="saju-section-title">세운 (년도별 운세)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
                {result.seWun.map(sw => {
                  const aiComment = seWunAiMap[sw.year]
                  const isLoading = aiComment === "…"
                  return (
                    <div
                      key={sw.year}
                      onClick={() => handleSeWunClick(sw)}
                      style={{
                        fontSize: 12, padding: "6px 8px",
                        border: "1px solid #c8bc9e", background: "var(--hanji)",
                        cursor: aiComment && !isLoading ? "default" : "pointer",
                      }}
                    >
                      <strong>{sw.year}</strong> {sw.ganZhi} {"★".repeat(sw.stars)}{" "}
                      <span style={{ color: "var(--ink-soft)" }}>{sw.rel}</span>
                      {!aiComment && <div style={{ marginTop: 2, color: "#b3a893", fontSize: 11 }}>탭하면 운세 보기</div>}
                      {isLoading && <div style={{ marginTop: 2, color: "var(--ink-soft)" }}>분석 중…</div>}
                      {aiComment && !isLoading && <div style={{ marginTop: 3, lineHeight: 1.4 }}>{aiComment}</div>}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* 대운: 최대 8개 */}
            <section className="saju-section">
              <h3 className="saju-section-title">
                대운 ({result.isForward ? "순행" : "역행"}, 시작: {result.daYunStart})
              </h3>
              <div className="dayun-list">
                {result.daYun.map((dy, i) => (
                  <div key={i} className="dayun-item">
                    <strong>{dy.ganZhi}</strong>
                    <span>{dy.startAge}~{dy.endAge}세</span>
                    <span className="dayun-year">{dy.startYear}~{dy.endYear}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default Onboarding

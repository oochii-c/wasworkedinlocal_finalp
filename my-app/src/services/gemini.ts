import { GoogleGenAI } from "@google/genai"
import type { SajuData } from "../components/Onboarding"

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

// Gemini가 반환하는 사주 해석 데이터 구조
export type GeminiSajuResult = {
  typeTitle: string                        // 일간 유형 한 줄
  hashtags: string[]                       // 성격 해시태그 3개
  sajuPuliy: string                        // 총운 풀이 텍스트
  simseongScores: Record<string, number>   // 심성 성향 5축 (0~100)
  sinsal: { name: string; desc: string }[] // 원국 신살
  daYunRating: {                           // 대운별 평가
    ganZhi: string
    startAge: number
    rating: number   // 1~5
    comment: string
  }[]
}

// SajuData → 원국 분석 프롬프트
function buildPrompt(data: SajuData, gender: string): string {
  const p = data.pillars
  const sajuText = `시(${p[3].ganZhi}) 일(${p[2].ganZhi}) 월(${p[1].ganZhi}) 연(${p[0].ganZhi})`

  const wuXingText = ["木", "火", "土", "金", "水"]
    .map(k => `${k} ${data.wuXingRatio.count[k]}개(${data.wuXingRatio.ratio[k]}%)`)
    .join(" · ")

  const shiShenText = p.map(pl =>
    `${pl.label}주: 천간(${pl.shiShenGan}) 지지(${pl.shiShenZhi.join("·")})`
  ).join(", ")

  const daYunText = data.daYun
    .map(dy => `${dy.ganZhi} ${dy.startAge}~${dy.endAge}세`)
    .join(" → ")

  return `당신은 사주명리학 전문가입니다. 아래 원국 데이터를 분석해 JSON만 반환하세요. 다른 텍스트 없이 JSON만 출력하세요.

[기본 정보]
성별: ${gender}
일간: ${data.dayGan}
사주 8자: ${sajuText}
대운: ${data.isForward ? "순행" : "역행"}, 시작 ${data.daYunStart}

[오행 분포 (8자 + 지장간)]
${wuXingText}

[십신]
${shiShenText}

[대운 목록]
${daYunText}

[요청 JSON 형식]
{
  "typeTitle": "일간 특성을 담은 유형명 (예: 임수(壬水) · 큰 강의 기운)",
  "hashtags": ["#특성1", "#특성2", "#특성3"],
  "sajuPuliy": "이 사주의 전반적인 특성, 성격, 삶의 방향을 200자 내외로 해석 (한국어)",
  "simseongScores": {
    "사교성": 0~100 사이 숫자,
    "리더십": 0~100 사이 숫자,
    "감수성": 0~100 사이 숫자,
    "실용성": 0~100 사이 숫자,
    "창의성": 0~100 사이 숫자
  },
  "sinsal": [
    { "name": "신살명", "desc": "이 신살이 어떤 의미인지 30자 내외" }
  ],
  "daYunRating": [
    { "ganZhi": "간지", "startAge": 숫자, "rating": 1~5 숫자, "comment": "이 대운의 흐름 한 줄" }
  ]
}`
}

// 원국 전체 분석 호출
export async function fetchGeminiSaju(
  data: SajuData,
  gender: string
): Promise<GeminiSajuResult> {
  const prompt = buildPrompt(data, gender)
  const result = await genAI.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: prompt,
  })
  const text = result.text ?? ""
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
  return JSON.parse(cleaned) as GeminiSajuResult
}

// 특정 연도 세운 한줄평 — 클릭 시 개별 호출
export async function fetchSeWunComment(
  year: number,
  ganZhi: string,
  rel: string,
  dayGan: string,
  gender: string
): Promise<string> {
  const prompt = `사주 일간: ${dayGan}, 성별: ${gender}
${year}년 세운 ${ganZhi} (일간과의 오행 관계: ${rel})
이 해의 운세를 30자 이내 한 줄로 설명하세요. 다른 텍스트 없이 문장만 출력하세요.`

  const result = await genAI.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: prompt,
  })
  return (result.text ?? "").trim()
}

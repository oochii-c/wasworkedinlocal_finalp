// server/prompts/year-fortune.js
// POST /api/year-fortune — 특정 연도 세운 풀이.
import { TONE_RULE, jsonOnly, LANG_RULE } from "./common.js";

export function buildYearFortunePrompt(v) {
  return `너는 사주 명리 해설가다. 아래 정보를 바탕으로 ${v.year}년 세운(歲運) 풀이를 쓴다.

- 일간(나): ${v.dayGan}(${v.dayKor}${v.dayElem}) · 오행 ${v.dayElem}
- ${v.year}년 세운 간지: ${v.ganZhi} — 천간 ${v.gan}(${v.yearKor}${v.yearElem}), 지지 ${v.zhi}(${v.zodiac}의 해)
- 천간 관계: ${v.rel} (${v.starsLabel}) — 세운 천간 ${v.yearElem}이 일간 ${v.dayElem}에 미치는 영향
- 총평: ${v.stars}점짜리 해

규칙:
1. 정확히 3문장으로 쓴다. 각 문장은 서로 다른 측면(이 해의 기운 / 실천 방향 / 구체적 조언)을 담는다.
2. ${v.zodiac}의 해 특성을 한 문장에 자연스럽게 녹인다.
3. 일간 ${v.dayGan}(${v.dayElem}) 기준으로 구체적이고 따뜻하게. ${TONE_RULE}
${jsonOnly(`{"text":"..."}`)}

${LANG_RULE}`;
}

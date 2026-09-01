// server/prompts/daily-fortune.js
// POST /api/daily-fortune — 오늘 하루(일진) 풀이. energy(날의 기운) + text(총평) 두 부분.
import { NO_FABRICATION, DAY_MASTER_RULE, TONE_RULE, jsonOnly, LANG_RULE } from "./common.js";

export const DAILY_FORTUNE_SYSTEM = `너는 '용궁' 사주 서비스의 명리 해설가다. 주어진 일진 정보를 바탕으로 "오늘 하루"를 두 부분으로 풀이한다.

[energy — "오늘의 기운"]
- 2~3문장. 건제12신·십이신(황흑도)·충·길신/흉살·길방을 엮어 "오늘이 어떤 성격의 날인지" 객관적으로 서술한다.
- 일간(나)·개인 조언은 넣지 않는다. 날 자체의 기운 묘사에 집중.
- 길신/흉살은 의미 있는 것 한둘만, 쉬운 우리말로 풀어 쓴다.

[text — "오늘의 총평"]
- 3문장. ①오늘의 전체 흐름 ②하면 좋은 실천·태도 ③조심할 것.
- 일간(나)을 기준으로 구체적으로 쓴다.

[공통]
- 출력 텍스트에 한자(漢字)를 쓰지 않는다. 간지·용어는 한글로 쓴다(예: 甲子 → 갑자, 定 → 정일, 靑龍 → 청룡).
- ${NO_FABRICATION}
- ${DAY_MASTER_RULE}
- ${TONE_RULE}
${jsonOnly(`{"energy":"...","text":"...","src":"..."}`)}
src 는 풀이의 핵심 근거(건제·십이신·신살 등)를 한 줄로 요약한다. 마땅치 않으면 빈 문자열.

${LANG_RULE}`;

export function buildDailyFortuneUser(v) {
  return `[오늘 일진]
- 일간(나): ${v.dayGan}(${v.dayKor}·${v.dayElem})
- 오늘 일진: ${v.dayGanZhi} — 천간 ${v.tGan}(${v.tKor}·${v.tElem}), 지지 ${v.tZhi}(${v.zodiac})
- 이번달 월운: ${v.monthGanZhi || "?"} · 올해 세운: ${v.yearGanZhi || "?"}
- 일진 천간과 일간의 관계: ${v.rel || "?"} (${v.starsLabel})
- 건제12신: ${v.jianChu || "?"}
- 십이신(황흑도): ${v.tianShen || "?"}${v.tianShenLuck ? ` (${v.tianShenLuck})` : ""}
- 오늘의 충: ${v.chong || "없음"}
- 길신: ${v.jiShen}
- 흉살: ${v.xiongSha}
- 길방: ${v.pos}
- 택일상 좋은 일: ${v.yi}
- 택일상 꺼릴 일: ${v.ji}
- 사주 원국 신살: ${v.shenSha}`;
}

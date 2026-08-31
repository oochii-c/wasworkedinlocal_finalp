// server/prompts/common.js
// 여러 프롬프트가 공유하는 규칙 블록 + 일간 anchor.
// 규칙 문안을 한 번만 고치면 모든 프롬프트에 반영된다.
import { GAN_INFO, LANG_RULE, ganLabel } from "../prompt-utils.js";

// prompt 파일들이 common 하나만 import 하면 되도록 re-export.
export { LANG_RULE };

export const NO_FABRICATION =
  "해석은 오직 주어진 원국에 실제로 존재하는 간지·십신·오행·신살만을 근거로 삼는다. 원국에 없는 것을 지어내지 않는다.";
export const DAY_MASTER_RULE =
  "모든 풀이는 반드시 일간(나)의 천간과 그 오행을 기준으로 한다. 팔자에 등장하는 다른 천간을 본인으로 착각하지 않는다.";
export const TONE_RULE = "점술적 단정보다 해석과 격려의 따뜻한 톤을 유지한다.";
export const jsonOnly = (shape) =>
  `반드시 아래 JSON 형식만 출력한다. 코드블록·주석·설명을 덧붙이지 않는다:\n${shape}`;

// 원국 앞에 붙는 일간 고정 배너 — 모델이 본인을 헷갈리지 않도록.
export function anchorLine(dayGan) {
  const [kor, elem] = GAN_INFO[dayGan] || ["?", "?"];
  return `★ 이 사람의 일간(본인 자신)은 "${ganLabel(dayGan)}", 오행은 "${elem}"이다. 모든 풀이는 이 일간 ${kor}(${elem})을 중심으로 하며, 팔자에 등장하는 다른 천간을 본인으로 착각하지 않는다.`;
}

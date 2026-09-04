// server/prompts/personas/index.js
// 상담 캐릭터 레지스트리. 캐릭터 = 정체성 + 말투 + 폴백 문구.
// 안전 층(근거 원칙·방어)은 safety.js 에 고정되어 캐릭터 밖에 있다.
import { PERSONA_SAFETY } from "./safety.js";
import { TURTLE_IDENTITY, TURTLE_FALLBACK } from "./turtle.js";
import { PRINCESS_IDENTITY, PRINCESS_FALLBACK } from "./princess.js";
import { SHARK_IDENTITY, SHARK_FALLBACK } from "./shark.js";
import { DOLPHIN_IDENTITY, DOLPHIN_FALLBACK } from "./dolphin.js";
import { HAIRTAIL_IDENTITY, HAIRTAIL_FALLBACK } from "./hairtail.js";

export const PERSONAS = {
  turtle:   { id: "turtle",   name: "거북 현자",  identity: TURTLE_IDENTITY,   fallback: TURTLE_FALLBACK },
  princess: { id: "princess", name: "용궁 공주",  identity: PRINCESS_IDENTITY, fallback: PRINCESS_FALLBACK },
  shark:    { id: "shark",    name: "상어 장군",  identity: SHARK_IDENTITY,    fallback: SHARK_FALLBACK },
  dolphin:  { id: "dolphin",  name: "돌고래",     identity: DOLPHIN_IDENTITY,  fallback: DOLPHIN_FALLBACK },
  hairtail: { id: "hairtail", name: "갈치",       identity: HAIRTAIL_IDENTITY, fallback: HAIRTAIL_FALLBACK },
};

export const DEFAULT_PERSONA_ID = "turtle";

// 모르는 id 는 기본 캐릭터로 떨어뜨린다(클라이언트가 뭘 보내든 서버가 결정).
export function getPersona(id) {
  return PERSONAS[id] || PERSONAS[DEFAULT_PERSONA_ID];
}

export { PERSONA_SAFETY };

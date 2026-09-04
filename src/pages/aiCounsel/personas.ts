// 상담 캐릭터 — 아이콘/이름/캐릭터 톤의 고정 문구.
// AI 답변 톤 자체는 서버(server/prompts/personas/)가 정한다. 여기는 화면 표시용.
import turtleIcon from "../../assets/icons/persona_turtle.png";
import princessIcon from "../../assets/icons/persona_princess.png";
import sharkIcon from "../../assets/icons/persona_shark.png";
import dolphinIcon from "../../assets/icons/persona_dolphin.png";
import hairtailIcon from "../../assets/icons/persona_hairtail.png";

export interface Persona {
  id: string;
  name: string;
  icon: string;
  tagline: string;   // 목록에서 대화 전 미리보기 줄
  welcome: string;   // 첫 인사
  reject: string;    // 인젝션 차단 시
  error: string;     // 요청 실패 시
}

export const PERSONAS: Persona[] = [
  {
    id: "turtle",
    tagline: "느긋하고 자상한 노현자. 서두르지 않고 풀어준다.",
    name: "거북 현자",
    icon: turtleIcon,
    welcome: "허허, 그대의 사주는 이미 들여다보았네. 무엇이 궁금한가, 천천히 물어보게.",
    reject: "허허, 나는 사주 이야기만 하네. 다른 물음은 접어두게.",
    error: "지금은 물살이 어지러워 말이 닿지 않는구먼. 조금 뒤에 다시 물어보게.",
  },
  {
    id: "princess",
    tagline: "다정하고 공감이 앞서는 상담. 마음부터 헤아린다.",
    name: "용궁 공주",
    icon: princessIcon,
    welcome: "네 사주는 벌써 다 봐뒀어. 편하게 물어봐, 뭐든 들어줄게.",
    reject: "미안, 나는 사주 이야기만 할 수 있어. 다른 건 어려워.",
    error: "지금은 파도가 심해서 말이 잘 안 닿네. 조금 뒤에 다시 물어봐 줄래?",
  },
  {
    id: "shark",
    tagline: "직설·단도직입. 할 일과 피할 일을 짚어준다.",
    name: "상어 장군",
    icon: sharkIcon,
    welcome: "네 판은 이미 봤다. 물어라. 돌려 말하지 않겠다.",
    reject: "사주 밖의 이야기는 받지 않는다.",
    error: "지금은 물살이 거칠어 말이 닿지 않는다. 잠시 뒤 다시 물어라.",
  },
  {
    id: "dolphin",
    tagline: "밝고 장난기 있는 친구. 무거운 얘기도 가볍게.",
    name: "돌고래",
    icon: dolphinIcon,
    welcome: "네 사주 벌써 다 봤지! 뭐부터 물어볼래?",
    reject: "앗, 나는 사주 얘기만 할 수 있어! 다른 건 패스.",
    error: "어라, 파도가 세서 말이 안 닿네. 조금 있다 다시 물어봐 줘.",
  },
  {
    id: "hairtail",
    tagline: "냉소적이고 날카로운 분석. 듣기 좋은 말은 없다.",
    name: "갈치",
    icon: hairtailIcon,
    welcome: "네 원국은 다 읽었어. 듣기 좋은 말은 기대하지 말고 물어봐.",
    reject: "사주 밖의 얘기엔 관심 없어.",
    error: "지금은 물살이 어지러워서 말이 안 닿아. 나중에 다시 물어봐.",
  },
];

export const DEFAULT_PERSONA = PERSONAS[0];

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? DEFAULT_PERSONA;
}

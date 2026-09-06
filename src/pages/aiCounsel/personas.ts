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
    tagline: "느긋하고 자상한 용궁의 노대신. 서두르지 않고 풀어준다.",
    name: "거북 대신",
    icon: turtleIcon,
    welcome: "허허, 왔는가. 무엇이 궁금한지 천천히 말해보게.",
    reject: "허허, 나는 사주 이야기만 하네. 다른 물음은 접어두게.",
    error: "'거북 대신'이 잠시 자리를 비웠어요.",
  },
  {
    id: "princess",
    tagline: "다정하고 공감이 앞서는 상담. 마음부터 헤아린다.",
    name: "용궁 공주",
    icon: princessIcon,
    welcome: "왔구나. 무슨 고민이야? 편하게 말해봐.",
    reject: "미안, 나는 사주 이야기만 할 수 있어. 다른 건 어려워.",
    error: "'용궁 공주'가 잠시 자리를 비웠어요.",
  },
  {
    id: "shark",
    tagline: "직설·단도직입. 할 일과 피할 일을 짚어준다.",
    name: "상어 장군",
    icon: sharkIcon,
    welcome: "왔어. 물어봐.",
    reject: "사주 밖의 얘긴 안 받아.",
    error: "'상어 장군'이 잠시 자리를 비웠어요.",
  },
  {
    id: "dolphin",
    tagline: "밝고 장난기 있는 친구. 무거운 얘기도 가볍게.",
    name: "돌고래",
    icon: dolphinIcon,
    welcome: "어서 와! 오늘은 뭐가 궁금해?",
    reject: "앗, 나는 사주 얘기만 할 수 있어! 다른 건 패스.",
    error: "'돌고래'가 잠시 자리를 비웠어요.",
  },
  {
    id: "hairtail",
    tagline: "엉뚱한 각도에서 원국을 다시 읽어준다. 새로운 시각 하나쯤은.",
    name: "갈치",
    icon: hairtailIcon,
    welcome: "네 원국, 좀 다르게 읽어봤어. 뭐가 궁금해?",
    reject: "그건 내 각도 밖이야. 사주 얘기 하자.",
    error: "'갈치'가 잠시 자리를 비웠어요.",
  },
];

export const DEFAULT_PERSONA = PERSONAS[0];

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? DEFAULT_PERSONA;
}
